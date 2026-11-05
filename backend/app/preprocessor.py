import io
import pandas as pd
import numpy as np
from typing import Tuple, Dict, Any, List

def clean_and_preprocess_dataset(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Validates, cleans, and computes event-level and case-level process mining metrics.
    Returns:
    - events_df: Cleaned event log with calculated waiting & duration minutes
    - cases_df: Aggregated case-level metrics (duration, rework count, SLA breach, delayed status)
    - data_quality: Summary report on missing values, duplicates, timestamps, etc.
    """
    initial_rows = len(df)
    
    # Standardize column naming
    col_mapping = {}
    for col in df.columns:
        c_clean = str(col).strip()
        c_lower = c_clean.lower().replace(" ", "_").replace("-", "_")
        if c_lower in ["case_id", "caseid", "order_id", "orderid", "id"]:
            col_mapping[col] = "Case_ID"
        elif c_lower in ["activity", "event", "task", "stage", "action"]:
            col_mapping[col] = "Activity"
        elif c_lower in ["timestamp", "time", "date", "datetime", "timestamp_start"]:
            col_mapping[col] = "Timestamp"
        elif c_lower in ["department", "dept", "org", "group"]:
            col_mapping[col] = "Department"
        elif c_lower in ["employee", "user", "agent", "resource", "assignee"]:
            col_mapping[col] = "Employee"
        elif c_lower in ["status", "state"]:
            col_mapping[col] = "Status"
        elif c_lower in ["priority", "urgency"]:
            col_mapping[col] = "Priority"
        elif c_lower in ["process_type", "processtype", "type", "category"]:
            col_mapping[col] = "Process_Type"
        elif c_lower in ["sla_hours", "sla", "sla_target"]:
            col_mapping[col] = "SLA_Hours"
        elif c_lower in ["cost", "expense", "amount"]:
            col_mapping[col] = "Cost"
        else:
            col_mapping[col] = c_clean

    df = df.rename(columns=col_mapping)

    # Check required columns
    required = ["Case_ID", "Activity", "Timestamp"]
    missing_required = [col for col in required if col not in df.columns]
    if missing_required:
        raise ValueError(f"Uploaded dataset is missing required column(s): {', '.join(missing_required)}. Expected Case_ID, Activity, and Timestamp.")

    # Collect missing value statistics before filling
    missing_stats = {str(k): int(v) for k, v in df.isnull().sum().items()}
    duplicates_count = int(df.duplicated(subset=["Case_ID", "Activity", "Timestamp"]).sum())

    # Drop exact duplicate events
    df = df.drop_duplicates(subset=["Case_ID", "Activity", "Timestamp"]).copy()

    # Fill optional defaults
    if "Department" not in df.columns:
        df["Department"] = "Operations"
    else:
        df["Department"] = df["Department"].fillna("Operations").astype(str)

    if "Employee" not in df.columns:
        df["Employee"] = "System"
    else:
        df["Employee"] = df["Employee"].fillna("System").astype(str)

    if "Status" not in df.columns:
        df["Status"] = "Completed"
    else:
        df["Status"] = df["Status"].fillna("Completed").astype(str)

    if "Priority" not in df.columns:
        df["Priority"] = "Medium"
    else:
        df["Priority"] = df["Priority"].fillna("Medium").astype(str)

    if "Process_Type" not in df.columns:
        df["Process_Type"] = "Standard"
    else:
        df["Process_Type"] = df["Process_Type"].fillna("Standard").astype(str)

    if "Cost" not in df.columns:
        df["Cost"] = 10.0
    else:
        df["Cost"] = pd.to_numeric(df["Cost"], errors="coerce").fillna(10.0)

    if "SLA_Hours" not in df.columns:
        # Default SLA according to priority
        sla_map = {"High": 14.0, "Medium": 24.0, "Low": 48.0}
        df["SLA_Hours"] = df["Priority"].map(sla_map).fillna(24.0)
    else:
        df["SLA_Hours"] = pd.to_numeric(df["SLA_Hours"], errors="coerce").fillna(24.0)

    # Convert Timestamp
    df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
    invalid_dates_count = int(df["Timestamp"].isnull().sum())
    df = df.dropna(subset=["Timestamp", "Case_ID", "Activity"]).copy()

    df["Case_ID"] = df["Case_ID"].astype(str)
    df["Activity"] = df["Activity"].astype(str)

    # Sort chronologically by Case and Timestamp
    df = df.sort_values(by=["Case_ID", "Timestamp"]).reset_index(drop=True)

    # Compute step sequence and duration / waiting times
    df["step_sequence"] = df.groupby("Case_ID").cumcount() + 1
    
    # Calculate time differences between consecutive events in each case
    # If explicit _proc_min and _wait_min exist (from generator), use them; otherwise compute from timestamp delta
    if "_proc_min" in df.columns and "_wait_min" in df.columns:
        df["duration_minutes"] = df["_proc_min"].astype(float)
        df["waiting_time_minutes"] = df["_wait_min"].astype(float)
    else:
        # Delta in minutes to next activity in the same case
        df["next_timestamp"] = df.groupby("Case_ID")["Timestamp"].shift(-1)
        df["delta_to_next_min"] = (df["next_timestamp"] - df["Timestamp"]).dt.total_seconds() / 60.0
        
        # In typical event logs where timestamp marks the event occurrence or start,
        # we estimate 40% duration, 60% transition queue waiting, or use natural bounds
        df["duration_minutes"] = df["delta_to_next_min"].fillna(30.0).clip(lower=2.0, upper=360.0) * 0.4
        df["waiting_time_minutes"] = df["delta_to_next_min"].fillna(30.0).clip(lower=0.0, upper=600.0) * 0.6
        df = df.drop(columns=["next_timestamp", "delta_to_next_min"])

    # Aggregate case-level metrics
    cases_summary = []
    for case_id, group in df.groupby("Case_ID"):
        start_t = group["Timestamp"].min()
        end_t = group["Timestamp"].max()
        # Total span in hours
        total_span_hours = max(0.5, (end_t - start_t).total_seconds() / 3600.0)
        # Add the duration of the final event to the span
        final_dur_h = (group.iloc[-1]["duration_minutes"]) / 60.0
        total_duration_hours = round(total_span_hours + final_dur_h, 2)
        total_waiting_hours = round(group["waiting_time_minutes"].sum() / 60.0, 2)
        act_count = len(group)
        
        # Rework detection: count occurrences beyond 1 for any activity
        act_freq = group["Activity"].value_counts()
        rework_count = int((act_freq[act_freq > 1] - 1).sum())

        sla_target = float(group.iloc[0]["SLA_Hours"])
        priority_val = str(group.iloc[0]["Priority"])
        last_act = str(group.iloc[-1]["Activity"])
        
        # Delayed condition
        is_breached = bool(total_duration_hours > sla_target)
        is_delayed = bool(is_breached or (group["Status"].str.lower() == "delayed").any())

        cases_summary.append({
            "Case_ID": case_id,
            "start_time": start_t,
            "end_time": end_t,
            "total_duration_hours": total_duration_hours,
            "total_waiting_hours": total_waiting_hours,
            "activity_count": act_count,
            "rework_count": rework_count,
            "sla_hours": sla_target,
            "is_sla_breached": is_breached,
            "is_delayed": is_delayed,
            "priority": priority_val,
            "current_status": "Completed" if not is_delayed else "Delayed",
            "last_activity": last_act,
            "first_department": str(group.iloc[0]["Department"])
        })

    cases_df = pd.DataFrame(cases_summary)

    # Data Quality summary
    data_quality = {
        "initial_rows": initial_rows,
        "cleaned_rows": len(df),
        "total_cases": len(cases_df),
        "duplicates_removed": duplicates_count,
        "invalid_timestamps": invalid_dates_count,
        "missing_values_by_column": missing_stats,
        "date_range": {
            "start": str(df["Timestamp"].min()),
            "end": str(df["Timestamp"].max())
        },
        "health_score": round(max(50.0, 100.0 - (duplicates_count / (initial_rows or 1) * 20) - (invalid_dates_count / (initial_rows or 1) * 30)), 1)
    }

    return df, cases_df, data_quality
