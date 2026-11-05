from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

# --- Auth Schemas ---
class UserRegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Dataset Management Schemas ---
class DatasetListItem(BaseModel):
    id: int
    filename: str
    row_count: int
    case_count: int
    upload_date: str
    status: str
    is_active: bool
    description: Optional[str] = None

class DatasetsListResponse(BaseModel):
    datasets: List[DatasetListItem]
    active_dataset_id: Optional[int] = None

class DatasetPreviewResponse(BaseModel):
    id: int
    filename: str
    total_rows: int
    total_cases: int
    upload_date: str
    columns: List[str]
    sample_records: List[Dict[str, Any]]
    data_quality: Dict[str, Any]

# --- Dashboard & Analytics Schemas ---
class KPIDashboardResponse(BaseModel):
    dataset_id: Optional[int] = None
    dataset_name: Optional[str] = None
    total_processes: int
    completed_processes: int
    delayed_processes: int
    delayed_percentage: float
    avg_completion_time_hours: float
    avg_waiting_time_hours: float
    overall_efficiency_score: float
    bottlenecks_detected_count: int
    high_risk_ongoing_count: int
    sla_violations_count: int
    sla_compliance_rate: float
    
    # Chart series
    completion_vs_delay: List[Dict[str, Any]]
    monthly_trends: List[Dict[str, Any]]
    department_performance: List[Dict[str, Any]]
    activity_processing_times: List[Dict[str, Any]]
    bottleneck_distribution: List[Dict[str, Any]]
    efficiency_trends: List[Dict[str, Any]]
    delay_risk_distribution: List[Dict[str, Any]]
    
    # Recent activity
    recent_cases: List[Dict[str, Any]]

class ProcessMiningGraphNode(BaseModel):
    id: str
    label: str
    frequency: int
    avg_duration_min: float
    avg_waiting_min: float
    department: str
    is_bottleneck: bool
    is_rework: bool
    severity: str

class ProcessMiningGraphEdge(BaseModel):
    source: str
    target: str
    frequency: int
    avg_transition_hours: float
    percentage_flow: float

class ProcessVariant(BaseModel):
    variant_id: int
    path: List[str]
    case_count: int
    percentage: float
    avg_duration_hours: float
    delayed_rate: float

class ProcessMiningResponse(BaseModel):
    dataset_id: Optional[int] = None
    nodes: List[ProcessMiningGraphNode]
    edges: List[ProcessMiningGraphEdge]
    variants: List[ProcessVariant]
    total_variants: int
    rework_activities: List[Dict[str, Any]]
    discovery_method: str

class BottleneckItem(BaseModel):
    activity: str
    department: str
    avg_processing_time_min: float
    median_processing_time_min: float
    max_processing_time_min: float
    min_processing_time_min: float
    avg_waiting_time_min: float
    cases_affected: int
    delay_frequency: int
    delay_percentage: float
    sla_violation_rate: float
    bottleneck_score: float
    severity: str
    possible_reason: str
    suggested_action: str

class BottlenecksResponse(BaseModel):
    dataset_id: Optional[int] = None
    bottlenecks: List[BottleneckItem]
    total_analyzed_activities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int

class ModelEvaluationMetrics(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    roc_auc: Optional[float] = None
    confusion_matrix: Dict[str, int]
    train_samples: int
    test_samples: int
    feature_importance: List[Dict[str, Any]]

class PredictDelayRequest(BaseModel):
    dataset_id: Optional[int] = None
    activity: str
    department: str
    priority: str
    time_spent_current_hours: float
    previous_activity_duration_hours: float
    rework_count: int
    sla_hours: float
    completed_stages_count: int
    cumulative_waiting_hours: Optional[float] = None

class PredictDelayResponse(BaseModel):
    case_id: Optional[str] = None
    delay_probability: float
    risk_category: str
    predicted_status: str
    contributing_factors: List[Dict[str, Any]]
    confidence_score: float
    model_metrics: Optional[ModelEvaluationMetrics] = None

class AnomalyItem(BaseModel):
    anomaly_id: int
    case_id: str
    activity: str
    department: str
    actual_time_min: float
    expected_time_min: float
    waiting_time_min: float
    anomaly_score: float
    severity: str
    explanation: str
    timestamp: str

class AnomaliesResponse(BaseModel):
    dataset_id: Optional[int] = None
    anomalies: List[AnomalyItem]
    total_anomalies: int
    contamination_rate: float
    anomalies_by_department: List[Dict[str, Any]]
    anomalies_by_activity: List[Dict[str, Any]]

class ClusterItem(BaseModel):
    case_id: str
    cluster_id: int
    cluster_label: str
    total_duration_hours: float
    total_waiting_hours: float
    rework_count: int
    activity_count: int
    sla_breached: bool
    pca_x: float
    pca_y: float

class ClusterProfile(BaseModel):
    cluster_id: int
    label: str
    count: int
    percentage: float
    avg_duration_hours: float
    avg_waiting_hours: float
    avg_rework_count: float
    delayed_percentage: float
    description: str

class ClusteringResponse(BaseModel):
    dataset_id: Optional[int] = None
    clusters: List[ClusterItem]
    profiles: List[ClusterProfile]
    optimal_k: int
    silhouette_score: float

class AIInsightItem(BaseModel):
    id: str
    category: str  # BOTTLENECK, REWORK, WORKLOAD, SLA, RESOURCE
    title: str
    severity: str  # Critical, Warning, Info, Success
    observation: str
    root_cause: str
    suggested_action: str
    expected_impact: str
    metric_value: str

class SimulationRequest(BaseModel):
    dataset_id: Optional[int] = None
    target_activity: str
    additional_staff_percentage: float
    processing_time_reduction_percentage: float
    waiting_time_reduction_percentage: float

class SimulationResponse(BaseModel):
    activity_targeted: str
    original_avg_duration_hours: float
    simulated_avg_duration_hours: float
    duration_improvement_percentage: float
    original_waiting_hours: float
    simulated_waiting_hours: float
    waiting_improvement_percentage: float
    original_delay_rate: float
    simulated_delay_rate: float
    delay_reduction_percentage: float
    original_efficiency: float
    simulated_efficiency: float
    efficiency_gain_percentage: float
    estimated_cost_saved_usd: float
    is_hypothetical_estimate: bool = True
