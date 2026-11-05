import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="analyst")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    datasets = relationship("UploadedDataset", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", cascade="all, delete-orphan", uselist=False)

class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    filename = Column(String(255), nullable=False)
    row_count = Column(Integer, default=0)
    case_count = Column(Integer, default=0)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="processed")  # uploaded, processed, error
    is_active = Column(Boolean, default=True, index=True)
    description = Column(String(500), nullable=True)
    data_quality_json = Column(Text, nullable=True)
    process_mining_json = Column(Text, nullable=True)
    ml_metrics_json = Column(Text, nullable=True)
    ai_insights_json = Column(Text, nullable=True)

    user = relationship("User", back_populates="datasets")
    events = relationship("ProcessEvent", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)
    cases = relationship("ProcessCase", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)
    bottlenecks = relationship("BottleneckResult", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)
    anomalies = relationship("AnomalyResult", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)
    clusters = relationship("ClusteringResult", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)
    predictions = relationship("DelayPrediction", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)
    simulations = relationship("SimulationRecord", back_populates="dataset", cascade="all, delete-orphan", passive_deletes=True)

class ProcessEvent(Base):
    __tablename__ = "process_events"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    case_id = Column(String(100), index=True, nullable=False)
    activity = Column(String(200), index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    department = Column(String(100), nullable=True, default="Operations")
    employee = Column(String(100), nullable=True, default="System")
    status = Column(String(50), nullable=True, default="Completed")
    priority = Column(String(50), nullable=True, default="Medium")
    process_type = Column(String(100), nullable=True, default="Standard")
    cost = Column(Float, nullable=True, default=0.0)
    sla_hours = Column(Float, nullable=True, default=24.0)
    
    # Derived metrics
    duration_minutes = Column(Float, default=0.0)
    waiting_time_minutes = Column(Float, default=0.0)
    step_sequence = Column(Integer, default=1)

    dataset = relationship("UploadedDataset", back_populates="events")

    __table_args__ = (
        Index("idx_event_dataset_case", "dataset_id", "case_id"),
        Index("idx_event_dataset_activity", "dataset_id", "activity"),
    )

class ProcessCase(Base):
    __tablename__ = "process_cases"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    case_id = Column(String(100), index=True, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    total_duration_hours = Column(Float, default=0.0)
    total_waiting_hours = Column(Float, default=0.0)
    activity_count = Column(Integer, default=0)
    rework_count = Column(Integer, default=0)
    sla_hours = Column(Float, default=24.0)
    is_delayed = Column(Boolean, default=False)
    is_sla_breached = Column(Boolean, default=False)
    priority = Column(String(50), default="Medium")
    current_status = Column(String(50), default="Completed")
    last_activity = Column(String(200), nullable=True)
    first_department = Column(String(100), nullable=True)
    delay_risk_score = Column(Float, default=0.0)
    risk_category = Column(String(50), default="Low")

    dataset = relationship("UploadedDataset", back_populates="cases")

    __table_args__ = (
        Index("idx_case_dataset_case", "dataset_id", "case_id"),
        Index("idx_case_dataset_delayed", "dataset_id", "is_delayed"),
    )

class BottleneckResult(Base):
    __tablename__ = "bottleneck_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    activity = Column(String(200), nullable=False)
    department = Column(String(100), nullable=True)
    avg_processing_time_min = Column(Float, default=0.0)
    median_processing_time_min = Column(Float, default=0.0)
    max_processing_time_min = Column(Float, default=0.0)
    min_processing_time_min = Column(Float, default=0.0)
    avg_waiting_time_min = Column(Float, default=0.0)
    cases_affected = Column(Integer, default=0)
    delay_frequency = Column(Integer, default=0)
    delay_percentage = Column(Float, default=0.0)
    sla_violation_rate = Column(Float, default=0.0)
    bottleneck_score = Column(Float, default=0.0)
    severity = Column(String(50), default="Low")  # Low, Medium, High, Critical
    possible_reason = Column(Text, nullable=True)
    suggested_action = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("UploadedDataset", back_populates="bottlenecks")

class DelayPrediction(Base):
    __tablename__ = "delay_predictions"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    case_id = Column(String(100), index=True, nullable=False)
    activity = Column(String(200), nullable=True)
    department = Column(String(100), nullable=True)
    delay_probability = Column(Float, default=0.0)
    risk_category = Column(String(50), default="Low")  # Low, Medium, High
    predicted_status = Column(String(50), default="On Time")  # Delayed, On Time
    confidence_score = Column(Float, default=0.0)
    contributing_factors_json = Column(Text, nullable=True)
    prediction_timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("UploadedDataset", back_populates="predictions")

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    case_id = Column(String(100), index=True, nullable=False)
    activity = Column(String(200), nullable=False)
    department = Column(String(100), nullable=True)
    actual_time_min = Column(Float, default=0.0)
    expected_time_min = Column(Float, default=0.0)
    waiting_time_min = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    severity = Column(String(50), default="Moderate")  # Moderate, High, Severe
    explanation = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("UploadedDataset", back_populates="anomalies")

class ClusteringResult(Base):
    __tablename__ = "clustering_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    case_id = Column(String(100), index=True, nullable=False)
    cluster_id = Column(Integer, default=0)
    cluster_label = Column(String(100), default="Normal Flow")
    duration_hours = Column(Float, default=0.0)
    waiting_hours = Column(Float, default=0.0)
    rework_count = Column(Integer, default=0)
    activity_count = Column(Integer, default=0)
    sla_breached = Column(Boolean, default=False)
    pca_x = Column(Float, default=0.0)
    pca_y = Column(Float, default=0.0)

    dataset = relationship("UploadedDataset", back_populates="clusters")

class SimulationRecord(Base):
    __tablename__ = "simulation_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("uploaded_datasets.id", ondelete="CASCADE"), index=True, nullable=False)
    target_activity = Column(String(200), nullable=False)
    additional_staff_pct = Column(Float, default=0.0)
    proc_time_reduction_pct = Column(Float, default=0.0)
    wait_time_reduction_pct = Column(Float, default=0.0)
    result_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    dataset = relationship("UploadedDataset", back_populates="simulations")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True, index=True)
    settings_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="settings")
