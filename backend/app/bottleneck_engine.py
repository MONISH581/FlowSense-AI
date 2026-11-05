import pandas as pd
import numpy as np
from typing import List, Dict, Any

def analyze_bottlenecks(events_df: pd.DataFrame, cases_df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Evaluates process bottlenecks across activities considering processing time,
    queue waiting time, SLA breaches, and delay frequencies.
    Uses robust normalization to resist extreme outlier skewing.
    """
    merged = events_df.merge(
        cases_df[["Case_ID", "is_delayed", "is_sla_breached", "total_duration_hours"]],
        on="Case_ID",
        how="left"
    )

    activities = merged["Activity"].unique()
    bottlenecks = []

    # Calculate robust upper baselines for normalization (resists single-activity outlier skew)
    activity_wait_means = merged.groupby("Activity")["waiting_time_minutes"].mean()
    activity_proc_means = merged.groupby("Activity")["duration_minutes"].mean()

    max_wait = float(activity_wait_means.quantile(0.95)) if len(activity_wait_means) > 2 else float(activity_wait_means.max() or 1.0)
    max_proc = float(activity_proc_means.quantile(0.95)) if len(activity_proc_means) > 2 else float(activity_proc_means.max() or 1.0)
    max_wait = max(15.0, max_wait)
    max_proc = max(15.0, max_proc)

    for act in activities:
        act_rows = merged[merged["Activity"] == act]
        dept = act_rows["Department"].iloc[0] if "Department" in act_rows.columns else "Operations"
        
        proc_mean = float(act_rows["duration_minutes"].mean())
        proc_median = float(act_rows["duration_minutes"].median())
        proc_max = float(act_rows["duration_minutes"].max())
        proc_min = float(act_rows["duration_minutes"].min())
        wait_mean = float(act_rows["waiting_time_minutes"].mean())
        
        total_cases_act = act_rows["Case_ID"].nunique()
        delayed_cases_act = act_rows[act_rows["is_delayed"] == True]["Case_ID"].nunique()
        sla_violation_cases = act_rows[act_rows["is_sla_breached"] == True]["Case_ID"].nunique()

        delay_pct = (delayed_cases_act / (total_cases_act or 1)) * 100.0
        sla_pct = (sla_violation_cases / (total_cases_act or 1)) * 100.0

        # Multi-factor score formulation (0 - 100)
        norm_wait = min(100.0, (wait_mean / max_wait) * 100.0)
        norm_proc = min(100.0, (proc_mean / max_proc) * 100.0)
        
        score = round((0.40 * norm_wait) + (0.20 * norm_proc) + (0.25 * delay_pct) + (0.15 * sla_pct), 1)

        # Severity categorization
        if score >= 70.0:
            severity = "Critical"
        elif score >= 50.0:
            severity = "High"
        elif score >= 30.0:
            severity = "Medium"
        else:
            severity = "Low"

        # Context-aware root cause and recommendations
        if wait_mean > 90.0 and "Finance" in dept:
            possible_reason = "Excessive pre-activity queuing in Finance. Manual payment reviews and batch verification backlogs cause upstream stalling."
            suggested_action = "Implement automated fraud screening rules and allocate 2 additional finance specialists during peak daytime orders."
        elif wait_mean > 60.0 and "Warehouse" in dept:
            possible_reason = "Inventory verification queue backlog. Physical stock re-counting and discrepancy reconciliation delay subsequent packing."
            suggested_action = "Integrate RFID automated inventory tracking and deploy dynamic picking slot assignments to reduce idle wait."
        elif proc_mean > 120.0 and "Logistics" in dept:
            possible_reason = "Extended transit and carrier routing times during final mile delivery."
            suggested_action = "Diversify regional 3PL courier partnerships and utilize dynamic dispatch route optimization."
        elif delay_pct > 35.0:
            possible_reason = f"High correlation with overall case SLA violations ({round(delay_pct, 1)}% of cases passing through here suffer delay)."
            suggested_action = "Audit stage handoffs, establish strict intermediate milestone alerts, and cross-train team members."
        elif severity in ["High", "Critical"]:
            possible_reason = f"Accumulation of both processing time ({round(proc_mean, 1)} min) and idle queue buffer ({round(wait_mean, 1)} min)."
            suggested_action = "Streamline approvals, reduce redundant validation checklists, and enable parallel task execution."
        else:
            possible_reason = "Operating within normal parameters; minor variance during order surges."
            suggested_action = "Maintain current staffing and monitor daily queue throughput."

        bottlenecks.append({
            "activity": act,
            "department": dept,
            "avg_processing_time_min": round(proc_mean, 1),
            "median_processing_time_min": round(proc_median, 1),
            "max_processing_time_min": round(proc_max, 1),
            "min_processing_time_min": round(proc_min, 1),
            "avg_waiting_time_min": round(wait_mean, 1),
            "cases_affected": total_cases_act,
            "delay_frequency": delayed_cases_act,
            "delay_percentage": round(delay_pct, 1),
            "sla_violation_rate": round(sla_pct, 1),
            "bottleneck_score": score,
            "severity": severity,
            "possible_reason": possible_reason,
            "suggested_action": suggested_action
        })

    bottlenecks = sorted(bottlenecks, key=lambda b: b["bottleneck_score"], reverse=True)
    return bottlenecks
