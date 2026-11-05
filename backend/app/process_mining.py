import pm4py
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple, Optional

def discover_process_flow(
    events_df: pd.DataFrame,
    cases_df: pd.DataFrame,
    bottlenecks_summary: Optional[Dict[str, Dict[str, Any]]] = None,
    min_edge_pct: float = 0.0
) -> Dict[str, Any]:
    """
    Applies PM4Py process mining techniques to discover the underlying workflow,
    generate the Directly-Follows Graph (DFG), extract process variants, and detect rework loops.
    Includes edge filtering to prevent unreadable spaghetti diagrams.
    """
    if bottlenecks_summary is None:
        bottlenecks_summary = {}

    # Format dataframe for PM4Py
    pm_df = pm4py.format_dataframe(
        events_df.copy(),
        case_id="Case_ID",
        activity_key="Activity",
        timestamp_key="Timestamp"
    )

    # Discover Directly-Follows Graph (DFG)
    dfg, start_activities, end_activities = pm4py.discover_dfg(pm_df)

    # Calculate activity metrics (frequency, average duration, waiting)
    act_metrics = {}
    for act, grp in events_df.groupby("Activity"):
        dept = grp["Department"].iloc[0] if "Department" in grp.columns else "Operations"
        freq = len(grp)
        avg_dur = float(grp["duration_minutes"].mean())
        avg_wait = float(grp["waiting_time_minutes"].mean())
        
        # Check if activity was flagged as bottleneck
        b_info = bottlenecks_summary.get(act, {})
        is_bn = b_info.get("severity") in ["High", "Critical"]
        sev = b_info.get("severity", "Low")

        act_metrics[act] = {
            "frequency": freq,
            "avg_duration_min": round(avg_dur, 1),
            "avg_waiting_min": round(avg_wait, 1),
            "department": dept,
            "is_bottleneck": is_bn,
            "severity": sev
        }

    # Extract rework occurrences
    rework_counts = {}
    for case_id, grp in events_df.groupby("Case_ID"):
        v_counts = grp["Activity"].value_counts()
        for act, cnt in v_counts.items():
            if cnt > 1:
                rework_counts[act] = rework_counts.get(act, 0) + (cnt - 1)

    rework_activities = [
        {"activity": act, "rework_occurrences": count, "affected_cases": int((events_df.groupby("Case_ID")["Activity"].apply(lambda s: (s == act).sum() > 1)).sum())}
        for act, count in sorted(rework_counts.items(), key=lambda x: x[1], reverse=True)
    ]

    # Build Graph Nodes
    nodes = []
    for act, data in act_metrics.items():
        is_rw = act in rework_counts
        nodes.append({
            "id": act,
            "label": act,
            "frequency": data["frequency"],
            "avg_duration_min": data["avg_duration_min"],
            "avg_waiting_min": data["avg_waiting_min"],
            "department": data["department"],
            "is_bottleneck": data["is_bottleneck"],
            "is_rework": is_rw,
            "severity": data["severity"]
        })

    # Total transitions for percentage calculation
    total_transitions = sum(dfg.values()) or 1

    # Build Graph Edges with optional noise filtering
    edges = []
    for (src, tgt), count in dfg.items():
        flow_pct = round((count / total_transitions) * 100.0, 1)
        if min_edge_pct > 0.0 and flow_pct < min_edge_pct:
            continue

        edges.append({
            "source": src,
            "target": tgt,
            "frequency": int(count),
            "avg_transition_hours": round(float(act_metrics.get(src, {}).get("avg_waiting_min", 30)) / 60.0, 2),
            "percentage_flow": flow_pct
        })

    # Sort edges by frequency descending
    edges = sorted(edges, key=lambda e: e["frequency"], reverse=True)

    # Process Variants Analysis
    case_paths = events_df.groupby("Case_ID")["Activity"].apply(lambda seq: tuple(seq)).reset_index()
    case_paths = case_paths.merge(cases_df[["Case_ID", "total_duration_hours", "is_delayed"]], on="Case_ID", how="left")

    variant_records = []
    variant_id = 1
    total_cases = len(case_paths)

    for path, p_group in case_paths.groupby("Activity"):
        p_cases_count = len(p_group)
        pct = round((p_cases_count / (total_cases or 1)) * 100.0, 2)
        avg_dur = round(float(p_group["total_duration_hours"].mean()), 1)
        del_rate = round(float(p_group["is_delayed"].mean()) * 100.0, 1)

        variant_records.append({
            "variant_id": variant_id,
            "path": list(path),
            "case_count": p_cases_count,
            "percentage": pct,
            "avg_duration_hours": avg_dur,
            "delayed_rate": del_rate
        })
        variant_id += 1

    variant_records = sorted(variant_records, key=lambda v: v["case_count"], reverse=True)

    return {
        "nodes": nodes,
        "edges": edges,
        "variants": variant_records[:10],
        "total_variants": len(variant_records),
        "rework_activities": rework_activities,
        "discovery_method": "Directly-Follows Graph (DFG) via PM4Py",
        "start_activities": list(start_activities.keys()),
        "end_activities": list(end_activities.keys())
    }
