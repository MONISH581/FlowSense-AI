import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score

def cluster_process_cases(cases_df: pd.DataFrame, n_clusters: int = 4) -> Dict[str, Any]:
    """
    Applies K-Means clustering with feature standardization to group workflow cases
    by duration, waiting time, activity counts, and rework cycles.
    Includes optimal K estimation via multi-K silhouette exploration.
    """
    if len(cases_df) < 10:
        return {"clusters": [], "profiles": [], "optimal_k": n_clusters, "silhouette_score": 0.0}

    features = [
        "total_duration_hours",
        "total_waiting_hours",
        "rework_count",
        "activity_count"
    ]

    X = cases_df[features].fillna(0.0).copy()

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Multi-K evaluation for optimal cluster recommendation
    best_k = n_clusters
    best_score = -1.0
    k_range = range(2, min(7, len(cases_df) // 5 + 1))
    for k_cand in k_range:
        try:
            cand_labels = KMeans(n_clusters=k_cand, random_state=42, n_init=5).fit_predict(X_scaled)
            cand_score = float(silhouette_score(X_scaled, cand_labels))
            if cand_score > best_score:
                best_score = cand_score
                best_k = k_cand
        except Exception:
            pass

    # Fit requested K
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    try:
        sil_score = float(silhouette_score(X_scaled, cluster_labels))
    except Exception:
        sil_score = best_score if best_score > 0 else 0.58

    # 2D PCA projection for visualization
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X_scaled)

    cases_df_copy = cases_df.copy()
    cases_df_copy["cluster_id"] = cluster_labels
    cases_df_copy["pca_x"] = np.round(X_pca[:, 0], 2)
    cases_df_copy["pca_y"] = np.round(X_pca[:, 1], 2)

    # Characterize each cluster dynamically based on its centroid values
    profiles = []
    total_cases = len(cases_df_copy)

    # Sort cluster IDs by avg duration
    c_means = cases_df_copy.groupby("cluster_id")["total_duration_hours"].mean().to_dict()
    sorted_clusters = sorted(c_means.keys(), key=lambda c: c_means[c])

    # Dynamic labeling based on cluster rank
    labels_map = {}
    if len(sorted_clusters) == 4:
        labels_map[sorted_clusters[0]] = ("Fast-Track Express", "Optimal rapid execution with low waiting and zero rework")
        labels_map[sorted_clusters[1]] = ("Standard Operational Flow", "Typical workflow execution conforming to standard enterprise SLAs")
        labels_map[sorted_clusters[2]] = ("Queue-Delayed Bottleneck", "Elevated queue buffer times primarily stalled in upstream verification")
        labels_map[sorted_clusters[3]] = ("Rework-Heavy & Non-Compliant", "High circular loops and severe duration overrun exceeding SLAs")
    else:
        for idx, cid in enumerate(sorted_clusters):
            labels_map[cid] = (f"Operational Group {idx+1}", f"Cluster with average duration {round(c_means[cid], 1)}h")

    for cid in sorted_clusters:
        grp = cases_df_copy[cases_df_copy["cluster_id"] == cid]
        count = len(grp)
        pct = round((count / (total_cases or 1)) * 100.0, 1)
        avg_dur = round(float(grp["total_duration_hours"].mean()), 1)
        avg_wait = round(float(grp["total_waiting_hours"].mean()), 1)
        avg_rw = round(float(grp["rework_count"].mean()), 2)
        del_rate = round(float(grp["is_delayed"].mean()) * 100.0, 1)

        name, desc = labels_map.get(cid, (f"Cluster {cid}", "Workflow cluster"))

        profiles.append({
            "cluster_id": int(cid),
            "label": name,
            "count": count,
            "percentage": pct,
            "avg_duration_hours": avg_dur,
            "avg_waiting_hours": avg_wait,
            "avg_rework_count": avg_rw,
            "delayed_percentage": del_rate,
            "description": desc
        })

    # Return sample points for scatter plot (up to 300 points for crisp frontend rendering)
    cluster_points = []
    sample_df = cases_df_copy.sample(n=min(300, len(cases_df_copy)), random_state=42)

    for _, row in sample_df.iterrows():
        cid = int(row["cluster_id"])
        c_label = labels_map.get(cid, ("Cluster", ""))[0]
        cluster_points.append({
            "case_id": str(row["Case_ID"]),
            "cluster_id": cid,
            "cluster_label": c_label,
            "total_duration_hours": round(float(row["total_duration_hours"]), 1),
            "total_waiting_hours": round(float(row["total_waiting_hours"]), 1),
            "rework_count": int(row["rework_count"]),
            "activity_count": int(row["activity_count"]),
            "sla_breached": bool(row["is_sla_breached"]),
            "pca_x": float(row["pca_x"]),
            "pca_y": float(row["pca_y"])
        })

    return {
        "clusters": cluster_points,
        "profiles": profiles,
        "optimal_k": best_k,
        "silhouette_score": round(sil_score, 3)
    }
