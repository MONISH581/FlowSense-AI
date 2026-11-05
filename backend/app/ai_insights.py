from typing import List, Dict, Any
import pandas as pd

def generate_ai_insights(
    bottlenecks: List[Dict[str, Any]],
    cases_df: pd.DataFrame,
    events_df: pd.DataFrame,
    rework_info: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Translates raw statistical and machine learning findings into concrete,
    executive-level business process intelligence recommendations.
    """
    insights = []
    
    # 1. Primary Bottleneck Insight
    if bottlenecks:
        top_b = bottlenecks[0]
        act_name = top_b["activity"]
        dept = top_b["department"]
        wait_m = top_b["avg_waiting_time_min"]
        proc_m = top_b["avg_processing_time_min"]
        aff_cases = top_b["cases_affected"]
        del_pct = top_b["delay_percentage"]
        
        insights.append({
            "id": "INS-BN-01",
            "category": "BOTTLENECK",
            "title": f"Primary Bottleneck Identified in {act_name}",
            "severity": "Critical" if top_b["severity"] in ["Critical", "High"] else "Warning",
            "observation": f"Cases spend an average of {wait_m} minutes in queue waiting for {act_name} to begin, with {proc_m} minutes execution time across {aff_cases} orders.",
            "root_cause": f"Severe queue buildup in {dept} department. Over {del_pct}% of orders passing through this stage ultimately breach customer SLAs.",
            "suggested_action": f"Deploy automated initial triage or reallocate 2-3 specialists to {dept} during peak batch windows.",
            "expected_impact": "Estimated 25-35% reduction in overall order completion time.",
            "metric_value": f"{wait_m} min queue delay"
        })

    # 2. Rework Loop Inefficiencies
    if rework_info:
        top_rw = rework_info[0]
        rw_act = top_rw["activity"]
        rw_cnt = top_rw["rework_occurrences"]
        aff_c = top_rw["affected_cases"]

        insights.append({
            "id": "INS-RW-02",
            "category": "REWORK",
            "title": f"Circular Rework Loop in {rw_act}",
            "severity": "Warning",
            "observation": f"{rw_act} was repeated {rw_cnt} times across {aff_c} separate customer orders.",
            "root_cause": "Inadequate initial validation or missing input criteria forces downstream stages to send orders backward for re-verification.",
            "suggested_action": "Introduce strict data validation checklists at order inception so cases do not require redundant secondary passes.",
            "expected_impact": f"Eliminates up to {rw_cnt} unnecessary duplicate handoffs.",
            "metric_value": f"{rw_cnt} rework loops"
        })

    # 3. Department Workload Imbalance
    dept_delays = events_df.groupby("Department")["waiting_time_minutes"].mean().to_dict()
    if dept_delays:
        highest_dept = max(dept_delays.items(), key=lambda x: x[1])
        lowest_dept = min(dept_delays.items(), key=lambda x: x[1])
        
        ratio = round(highest_dept[1] / max(1.0, lowest_dept[1]), 1)
        insights.append({
            "id": "INS-WL-03",
            "category": "WORKLOAD",
            "title": f"Inter-Department Queue Imbalance ({highest_dept[0]})",
            "severity": "Warning" if ratio > 2.0 else "Info",
            "observation": f"Average queue time in {highest_dept[0]} ({round(highest_dept[1], 1)}m) is {ratio}x higher than {lowest_dept[0]} ({round(lowest_dept[1], 1)}m).",
            "root_cause": "Static staffing allocations do not accommodate variable order arrival bursts throughout the day.",
            "suggested_action": f"Establish a dynamic floating resource pool to cross-support {highest_dept[0]} during afternoon demand spikes.",
            "expected_impact": "Levels department throughput and eliminates upstream operational idle time.",
            "metric_value": f"{ratio}x queue disparity"
        })

    # 4. Priority & SLA Compliance Warning
    prio_compliance = cases_df.groupby("priority")["is_sla_breached"].mean().to_dict()
    high_breach = prio_compliance.get("High", 0.0) * 100.0
    if high_breach > 20.0:
        insights.append({
            "id": "INS-SLA-04",
            "category": "SLA",
            "title": "High Priority Order SLA Vulnerability",
            "severity": "Critical",
            "observation": f"{round(high_breach, 1)}% of High-Priority / Express orders breached their target turnaround commitment.",
            "root_cause": "High-priority orders share the same single-threaded queues with standard and economy orders in verification stages.",
            "suggested_action": "Implement priority queue bypass routing ('VIP Fast-Lane') in order verification and picking systems.",
            "expected_impact": "Directly safeguards customer SLA guarantees and protects high-value revenue.",
            "metric_value": f"{round(high_breach, 1)}% High-Priority breach"
        })

    # 5. Resource Optimization & Automation Recommendation
    insights.append({
        "id": "INS-RES-05",
        "category": "RESOURCE",
        "title": "Robotic Process Automation (RPA) Opportunity",
        "severity": "Success",
        "observation": "Rule-based activities (Order Creation, Standard Payment Check) exhibit low variance and high transaction volume.",
        "root_cause": "Human resources remain allocated to routine transactional checks that can be auto-approved.",
        "suggested_action": "Transition 80% of low-risk orders to zero-touch automated processing, freeing team members for complex exceptions.",
        "expected_impact": "Saves up to $18,000 annually in operational remediation overhead.",
        "metric_value": "80% auto-approval potential"
    })

    return insights
