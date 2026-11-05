import io
import datetime
from typing import Dict, Any, List
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf_report(
    dataset_info: Dict[str, Any],
    kpis: Dict[str, Any],
    bottlenecks: List[Dict[str, Any]],
    ml_metrics: Dict[str, Any],
    insights: List[Dict[str, Any]]
) -> bytes:
    """
    Constructs a multi-page PDF analytical intelligence report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom report styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    )

    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceAfter=6
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # Title & Header
    story.append(Paragraph("FlowSense AI &bull; Executive Process Intelligence Report", title_style))
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime('%B %d, %Y %H:%M UTC')
    story.append(Paragraph(f"Generated on {now_str} | Automated Workflow Audit", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4338ca'), spaceBefore=2, spaceAfter=14))

    # Executive KPI Summary
    story.append(Paragraph("1. Executive Operational Scorecard", h2_style))
    kpi_data = [
        [
            Paragraph("<b>Total Cases:</b>", table_cell_style), Paragraph(str(kpis.get("total_processes", 0)), table_cell_style),
            Paragraph("<b>Avg Completion:</b>", table_cell_style), Paragraph(f"{kpis.get('avg_completion_time_hours', 0)} hrs", table_cell_style)
        ],
        [
            Paragraph("<b>Delayed Cases:</b>", table_cell_style), Paragraph(f"{kpis.get('delayed_processes', 0)} ({kpis.get('delayed_percentage', 0)}%)", table_cell_style),
            Paragraph("<b>Avg Idle Queue:</b>", table_cell_style), Paragraph(f"{kpis.get('avg_waiting_time_hours', 0)} hrs", table_cell_style)
        ],
        [
            Paragraph("<b>Efficiency Rating:</b>", table_cell_style), Paragraph(f"{kpis.get('overall_efficiency_score', 0)}%", table_cell_style),
            Paragraph("<b>SLA Compliance:</b>", table_cell_style), Paragraph(f"{kpis.get('sla_compliance_rate', 0)}%", table_cell_style)
        ]
    ]
    kpi_table = Table(kpi_data, colWidths=[120, 140, 120, 140])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 12))

    # Bottleneck Findings Table
    story.append(Paragraph("2. Bottleneck Detection & Friction Points", h2_style))
    bn_rows = [
        [
            Paragraph("Activity", table_header_style),
            Paragraph("Dept", table_header_style),
            Paragraph("Wait Time", table_header_style),
            Paragraph("Proc Time", table_header_style),
            Paragraph("Delay %", table_header_style),
            Paragraph("Severity", table_header_style)
        ]
    ]

    for b in bottlenecks[:6]:
        sev_color = '#dc2626' if b['severity'] == 'Critical' else ('#ea580c' if b['severity'] == 'High' else '#16a34a')
        sev_p = Paragraph(f"<font color='{sev_color}'><b>{b['severity']}</b></font>", table_cell_style)
        bn_rows.append([
            Paragraph(b["activity"], table_cell_style),
            Paragraph(b["department"], table_cell_style),
            Paragraph(f"{b['avg_waiting_time_min']}m", table_cell_style),
            Paragraph(f"{b['avg_processing_time_min']}m", table_cell_style),
            Paragraph(f"{b['delay_percentage']}%", table_cell_style),
            sev_p
        ])

    bn_table = Table(bn_rows, colWidths=[130, 90, 75, 75, 70, 80])
    bn_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e293b')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')]),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(bn_table)
    story.append(Spacer(1, 12))

    # Machine Learning Delay Predictor Evaluation
    story.append(Paragraph("3. Predictive AI Model Evaluation (Random Forest)", h2_style))
    if ml_metrics and "accuracy" in ml_metrics:
        cm = ml_metrics.get("confusion_matrix", {})
        ml_summary = f"""Supervised Random Forest Classifier trained on {ml_metrics.get('train_samples', 0)} workflow snapshots.<br/>
        &bull; <b>Accuracy:</b> {round(ml_metrics.get('accuracy', 0)*100, 1)}% &nbsp;|&nbsp; 
        &bull; <b>Precision:</b> {round(ml_metrics.get('precision', 0)*100, 1)}% &nbsp;|&nbsp; 
        &bull; <b>Recall:</b> {round(ml_metrics.get('recall', 0)*100, 1)}% &nbsp;|&nbsp; 
        &bull; <b>F1-Score:</b> {round(ml_metrics.get('f1_score', 0)*100, 1)}%<br/>
        &bull; <b>Confusion Matrix:</b> True Negative={cm.get('true_negative', 0)}, False Positive={cm.get('false_positive', 0)}, False Negative={cm.get('false_negative', 0)}, True Positive={cm.get('true_positive', 0)}
        """
        story.append(Paragraph(ml_summary, body_style))
    else:
        story.append(Paragraph("Predictive model pending training or evaluation.", body_style))
    story.append(Spacer(1, 10))

    # Strategic AI Recommendations
    story.append(Paragraph("4. Strategic AI Optimization Recommendations", h2_style))
    for ins in insights[:4]:
        rec_block = [
            Paragraph(f"<b>[{ins.get('category')}] {ins.get('title')}</b>", ParagraphStyle('RecH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#312e81'))),
            Paragraph(f"<b>Observation:</b> {ins.get('observation')}", body_style),
            Paragraph(f"<b>Suggested Action:</b> {ins.get('suggested_action')}", body_style),
            Paragraph(f"<b>Expected Business Impact:</b> {ins.get('expected_impact')}", ParagraphStyle('Imp', parent=body_style, textColor=colors.HexColor('#047857'))),
            Spacer(1, 4)
        ]
        story.extend(rec_block)

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

def generate_cases_csv(cases_df: pd.DataFrame) -> str:
    """
    Returns CSV export string of all analyzed process cases with delay labels and clusters.
    """
    return cases_df.to_csv(index=False)
