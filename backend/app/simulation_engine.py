import pandas as pd
import numpy as np
from typing import Dict, Any

def run_what_if_simulation(
    events_df: pd.DataFrame,
    cases_df: pd.DataFrame,
    target_activity: str,
    additional_staff_pct: float = 20.0,
    proc_time_reduction_pct: float = 25.0,
    wait_time_reduction_pct: float = 30.0
) -> Dict[str, Any]:
    """
    Simulates operational improvements (staff reallocation, automation, and queue reduction)
    on historical event logs to project realistic workflow gains.
    """
    if target_activity not in events_df["Activity"].values:
        # Fallback to the top bottleneck activity
        target_activity = str(events_df["Activity"].iloc[0])

    events_sim = events_df.copy()
    mask = (events_sim["Activity"] == target_activity)

    # Elasticity coefficients
    # Additional staff reduces queue wait by 0.7x coefficient and processing by 0.3x
    staff_factor = 1.0 + (additional_staff_pct / 100.0)
    proc_cut = (proc_time_reduction_pct / 100.0)
    wait_cut = (wait_time_reduction_pct / 100.0)

    orig_target_proc = float(events_sim.loc[mask, "duration_minutes"].mean())
    orig_target_wait = float(events_sim.loc[mask, "waiting_time_minutes"].mean())

    # Simulated reductions for target activity
    events_sim.loc[mask, "sim_duration_min"] = (
        events_sim.loc[mask, "duration_minutes"] * (1.0 - proc_cut) / (1.0 + (staff_factor - 1.0) * 0.3)
    ).clip(lower=2.0)

    events_sim.loc[mask, "sim_waiting_min"] = (
        events_sim.loc[mask, "waiting_time_minutes"] * (1.0 - wait_cut) / (1.0 + (staff_factor - 1.0) * 0.7)
    ).clip(lower=0.0)

    # For non-target activities, retain original values
    events_sim["sim_duration_min"] = events_sim["sim_duration_min"].fillna(events_sim["duration_minutes"])
    events_sim["sim_waiting_min"] = events_sim["sim_waiting_min"].fillna(events_sim["waiting_time_minutes"])

    # Calculate time saved per case
    events_sim["time_saved_min"] = (
        (events_sim["duration_minutes"] - events_sim["sim_duration_min"]) +
        (events_sim["waiting_time_minutes"] - events_sim["sim_waiting_min"])
    )

    case_savings = events_sim.groupby("Case_ID")["time_saved_min"].sum() / 60.0 # in hours

    sim_cases = cases_df.copy()
    sim_cases["sim_total_duration_hours"] = (
        sim_cases["total_duration_hours"] - sim_cases["Case_ID"].map(case_savings).fillna(0.0)
    ).clip(lower=1.0)

    sla_target = sim_cases["sla_hours"] if "sla_hours" in sim_cases.columns else sim_cases.get("priority", pd.Series(["Medium"] * len(sim_cases))).map({"High": 14.0, "Medium": 24.0, "Low": 48.0}).fillna(24.0)
    sim_cases["sim_is_delayed"] = sim_cases["sim_total_duration_hours"] > sla_target

    # Overall metrics
    orig_avg_dur = float(cases_df["total_duration_hours"].mean())
    sim_avg_dur = float(sim_cases["sim_total_duration_hours"].mean())
    dur_improvement = ((orig_avg_dur - sim_avg_dur) / (orig_avg_dur or 1.0)) * 100.0

    orig_avg_wait = float(cases_df["total_waiting_hours"].mean())
    sim_avg_wait = max(0.2, orig_avg_wait - (float(events_sim.loc[mask, "waiting_time_minutes"].mean() - events_sim.loc[mask, "sim_waiting_min"].mean()) / 60.0))
    wait_improvement = ((orig_avg_wait - sim_avg_wait) / (orig_avg_wait or 1.0)) * 100.0

    orig_delay_rate = float(cases_df["is_delayed"].mean()) * 100.0
    sim_delay_rate = float(sim_cases["sim_is_delayed"].mean()) * 100.0
    delay_reduction = ((orig_delay_rate - sim_delay_rate) / (orig_delay_rate or 1.0)) * 100.0

    orig_efficiency = max(20.0, min(95.0, 100.0 - (orig_delay_rate * 0.85)))
    sim_efficiency = max(20.0, min(98.0, 100.0 - (sim_delay_rate * 0.85)))
    eff_gain = sim_efficiency - orig_efficiency

    # Estimated cost savings (assuming $35 / delayed case remediation cost)
    delayed_saved_count = max(0, int((cases_df["is_delayed"].sum() - sim_cases["sim_is_delayed"].sum())))
    est_cost_savings = delayed_saved_count * 45.0

    return {
        "activity_targeted": target_activity,
        "original_avg_duration_hours": round(orig_avg_dur, 1),
        "simulated_avg_duration_hours": round(sim_avg_dur, 1),
        "duration_improvement_percentage": round(dur_improvement, 1),
        "original_waiting_hours": round(orig_avg_wait, 1),
        "simulated_waiting_hours": round(sim_avg_wait, 1),
        "waiting_improvement_percentage": round(wait_improvement, 1),
        "original_delay_rate": round(orig_delay_rate, 1),
        "simulated_delay_rate": round(sim_delay_rate, 1),
        "delay_reduction_percentage": round(delay_reduction, 1),
        "original_efficiency": round(orig_efficiency, 1),
        "simulated_efficiency": round(sim_efficiency, 1),
        "efficiency_gain_percentage": round(eff_gain, 1),
        "estimated_cost_saved_usd": round(est_cost_savings, 2),
        "is_hypothetical_estimate": True
    }
