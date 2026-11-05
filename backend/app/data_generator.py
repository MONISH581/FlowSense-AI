import random
import datetime
import pandas as pd
import numpy as np

def generate_ecommerce_event_log(num_cases: int = 2200, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic synthetic process mining event log for an e-commerce order fulfillment workflow.
    Features:
    - 2,200+ cases and ~14,000+ events
    - Clear bottleneck in 'Payment Verification' (Finance queue delays)
    - Secondary bottleneck in 'Packing' (Warehouse resource constraints)
    - Realistic rework loops (e.g., Payment re-verification, Item re-inspection)
    - SLA violation rules and realistic noise
    """
    random.seed(seed)
    np.random.seed(seed)

    base_start_date = datetime.datetime(2026, 5, 1, 8, 0, 0)
    
    departments = {
        "Order Created": "Sales",
        "Payment Verification": "Finance",
        "Manual Fraud Review": "Finance",
        "Inventory Check": "Warehouse",
        "Backorder Allocation": "Warehouse",
        "Packing": "Warehouse",
        "Quality Inspection": "Quality Assurance",
        "Shipping": "Logistics",
        "Delivery": "Logistics"
    }

    employees = {
        "Sales": ["System Automated", "EMP-Sales-01", "EMP-Sales-02"],
        "Finance": ["EMP-Fin-01", "EMP-Fin-02", "EMP-Fin-03", "EMP-Fin-04"],
        "Warehouse": ["EMP-Wh-01", "EMP-Wh-02", "EMP-Wh-03", "EMP-Wh-04", "EMP-Wh-05"],
        "Quality Assurance": ["EMP-QA-01", "EMP-QA-02"],
        "Logistics": ["EMP-Log-01", "EMP-Log-02", "EMP-Log-03", "EMP-Log-04"]
    }

    records = []

    for i in range(1, num_cases + 1):
        case_id = f"ORD-{10000 + i}"
        
        # Priority distribution: 20% High, 60% Medium, 20% Low
        p_rand = random.random()
        if p_rand < 0.20:
            priority = "High"
            sla_hours = 14.0
            process_type = "Express Order"
        elif p_rand < 0.80:
            priority = "Medium"
            sla_hours = 24.0
            process_type = "Standard Fulfillment"
        else:
            priority = "Low"
            sla_hours = 48.0
            process_type = "Economy Shipping"

        # Distribute cases over 180 days with business hours bias
        day_offset = random.randint(0, 180)
        hour_offset = random.choice([8, 9, 10, 11, 13, 14, 15, 16, 17, 19])
        minute_offset = random.randint(0, 59)
        case_current_time = base_start_date + datetime.timedelta(days=day_offset, hours=hour_offset, minutes=minute_offset)
        case_start_time = case_current_time

        # Determine path behavior:
        # 68% Normal Happy Path
        # 18% Payment Rework/Verification Delay Path (Finance Bottleneck)
        # 9% Inventory Backorder Path
        # 5% QA Inspection Rework
        path_type = random.choices(["happy", "payment_rework", "inventory_rework", "qa_rework"], weights=[68, 18, 9, 5])[0]

        activities_flow = []

        if path_type == "happy":
            activities_flow = [
                ("Order Created", 2, 0),
                ("Payment Verification", 35, 120),  # Processing min, queue waiting min (Finance bottleneck!)
                ("Inventory Check", 25, 45),
                ("Packing", 45, 60),
                ("Shipping", 60, 90),
                ("Delivery", 180, 240)
            ]
        elif path_type == "payment_rework":
            activities_flow = [
                ("Order Created", 2, 0),
                ("Payment Verification", 45, 180),
                ("Manual Fraud Review", 90, 240),   # Severe queue and delay
                ("Payment Verification", 40, 150),  # Rework loop!
                ("Inventory Check", 25, 50),
                ("Packing", 50, 70),
                ("Shipping", 60, 100),
                ("Delivery", 180, 260)
            ]
        elif path_type == "inventory_rework":
            activities_flow = [
                ("Order Created", 2, 0),
                ("Payment Verification", 30, 90),
                ("Inventory Check", 30, 40),
                ("Backorder Allocation", 120, 300),  # Delay in warehouse
                ("Inventory Check", 20, 30),        # Rework loop!
                ("Packing", 40, 60),
                ("Shipping", 60, 90),
                ("Delivery", 180, 220)
            ]
        else: # qa_rework
            activities_flow = [
                ("Order Created", 2, 0),
                ("Payment Verification", 30, 80),
                ("Inventory Check", 25, 40),
                ("Packing", 45, 60),
                ("Quality Inspection", 40, 70),
                ("Packing", 30, 50),                 # Repack rework
                ("Shipping", 60, 90),
                ("Delivery", 180, 240)
            ]

        # Occasionally add spike delay to simulate unpredictable logistics issues (10% of cases)
        has_logistics_spike = (random.random() < 0.10)

        for act_name, base_proc, base_wait in activities_flow:
            dept = departments.get(act_name, "Operations")
            emp = random.choice(employees.get(dept, ["EMP-Generic"]))

            # Add natural variance
            proc_noise = max(1.0, np.random.normal(loc=base_proc, scale=base_proc * 0.25))
            wait_noise = max(0.0, np.random.normal(loc=base_wait, scale=base_wait * 0.35))

            if act_name == "Payment Verification" and priority == "Low":
                # Low priority orders sit longer in finance queue
                wait_noise *= 1.4

            if has_logistics_spike and act_name in ["Shipping", "Delivery"]:
                wait_noise *= 2.2
                proc_noise *= 1.8

            # Waiting time advances clock before activity starts
            case_current_time += datetime.timedelta(minutes=wait_noise)
            event_timestamp = case_current_time
            # Processing time advances clock
            case_current_time += datetime.timedelta(minutes=proc_noise)

            cost = round(random.uniform(5.0, 35.0) + (proc_noise * 0.2), 2)

            records.append({
                "Case_ID": case_id,
                "Activity": act_name,
                "Timestamp": event_timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "Department": dept,
                "Employee": emp,
                "Status": "Completed",
                "Priority": priority,
                "Process_Type": process_type,
                "Cost": cost,
                "SLA_Hours": sla_hours,
                "_proc_min": round(proc_noise, 2),
                "_wait_min": round(wait_noise, 2)
            })

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    df = generate_ecommerce_event_log(100)
    print("Generated rows:", len(df))
    print(df.head(10))
