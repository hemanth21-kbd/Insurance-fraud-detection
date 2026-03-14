import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json
import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import time
import threading
import random
from twilio.rest import Client

# Mock alert storage (in production, use a database)
ALERTS_STORAGE = []
ALERT_SUBSCRIBERS = {
    'email': ['admin@insurance.com', 'fraud.team@insurance.com'],
    'sms': ['+1234567890', '+0987654321']
}

class FraudAlertSystem:
    def __init__(self):
        self.alerts = ALERTS_STORAGE
        self.subscribers = ALERT_SUBSCRIBERS
        self.monitoring_active = False
        self.monitor_thread = None

        # Email configuration (mock)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_user = os.getenv('EMAIL_USER', 'alerts@insurance.com')
        self.email_password = os.getenv('EMAIL_PASSWORD', 'password')

        # Twilio configuration (mock)
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID', 'mock_sid')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN', 'mock_token')
        self.twilio_from_number = os.getenv('TWILIO_FROM_NUMBER', '+1234567890')

        try:
            self.twilio_client = Client(self.twilio_account_sid, self.twilio_auth_token)
        except:
            self.twilio_client = None

    def start_monitoring(self, threshold: float = 0.75):
        """Start real-time monitoring for fraud alerts"""
        if self.monitoring_active:
            return {"message": "Monitoring already active"}

        self.monitoring_active = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, args=(threshold,))
        self.monitor_thread.daemon = True
        self.monitor_thread.start()

        return {"message": "Fraud monitoring started", "threshold": threshold}

    def stop_monitoring(self):
        """Stop real-time monitoring"""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        return {"message": "Fraud monitoring stopped"}

    def _monitor_loop(self, threshold: float):
        """Background monitoring loop"""
        while self.monitoring_active:
            try:
                # In a real system, this would poll a database or message queue
                # For demo purposes, we'll generate mock alerts periodically
                self._check_for_new_alerts(threshold)
                time.sleep(30)  # Check every 30 seconds
            except Exception as e:
                print(f"Monitoring error: {e}")
                time.sleep(60)

    def _check_for_new_alerts(self, threshold: float):
        """Check for new high-risk claims and create alerts"""
        # Mock: Generate random alerts for demonstration
        import random
        if random.random() < 0.3:  # 30% chance of new alert every check
            mock_hospitals = [
                "City General Hospital", "Metro Medical Center",
                "Regional Hospital", "University Medical Center"
            ]

            alert = {
                "alert_id": f"ALT-{int(time.time())}",
                "claim_id": f"CLM-{random.randint(100000, 999999)}",
                "hospital_name": random.choice(mock_hospitals),
                "fraud_score": random.uniform(threshold * 100, 95),
                "risk_level": "High Risk",
                "timestamp": datetime.now().isoformat(),
                "suspicious_indicators": self._generate_suspicious_indicators(),
                "status": "active",
                "escalation_level": "high" if random.random() < 0.5 else "medium"
            }

            self.create_alert(alert)

    def _generate_suspicious_indicators(self) -> List[str]:
        """Generate mock suspicious indicators"""
        indicators = [
            "Claim amount significantly higher than similar procedures",
            "Unusual medicine combination detected",
            "Hospital has elevated fraud rate this month",
            "Patient has multiple recent claims with same diagnosis",
            "Procedure codes don't match documented diagnosis",
            "Billing frequency exceeds normal patterns",
            "Geographic anomaly in claim location",
            "Time-based pattern suggests potential fraud ring"
        ]
        return [random.choice(indicators) for _ in range(random.randint(1, 3))]

    def create_alert(self, alert_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new fraud alert and trigger notifications"""
        alert = {
            **alert_data,
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }

        self.alerts.append(alert)

        # Trigger notifications
        self._send_notifications(alert)

        return {
            "alert_id": alert["alert_id"],
            "status": "created",
            "notifications_sent": True
        }

    def _send_notifications(self, alert: Dict[str, Any]):
        """Send alert notifications via email and SMS"""
        try:
            # Send email notifications
            self._send_email_alert(alert)

            # Send SMS notifications for high-priority alerts
            if alert.get("escalation_level") == "high":
                self._send_sms_alert(alert)

        except Exception as e:
            print(f"Notification error: {e}")

    def _send_email_alert(self, alert: Dict[str, Any]):
        """Send email alert to subscribers"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = ', '.join(self.subscribers['email'])
            msg['Subject'] = f"🚨 HIGH PRIORITY FRAUD ALERT - {alert['alert_id']}"

            body = f"""
            FRAUD ALERT DETECTED

            Alert ID: {alert['alert_id']}
            Claim ID: {alert['claim_id']}
            Hospital: {alert['hospital_name']}
            Fraud Score: {alert['fraud_score']:.1f}%
            Risk Level: {alert['risk_level']}
            Timestamp: {alert['timestamp']}

            Suspicious Indicators:
            {chr(10).join(f"• {indicator}" for indicator in alert['suspicious_indicators'])}

            Please review immediately and take appropriate action.

            Fraud Detection System
            """

            msg.attach(MIMEText(body, 'plain'))

            # In a real system, you would connect to SMTP server
            # For demo purposes, we'll just print the email
            print(f"EMAIL ALERT SENT to {self.subscribers['email']}")
            print(f"Subject: {msg['Subject']}")
            print(body)

        except Exception as e:
            print(f"Email sending failed: {e}")

    def _send_sms_alert(self, alert: Dict[str, Any]):
        """Send SMS alert for high-priority cases"""
        try:
            message_body = f"""🚨 FRAUD ALERT: Claim {alert['claim_id']} at {alert['hospital_name']} - Score: {alert['fraud_score']:.1f}%"""

            if self.twilio_client:
                for phone_number in self.subscribers['sms']:
                    # In production: self.twilio_client.messages.create(...)
                    print(f"SMS ALERT SENT to {phone_number}: {message_body}")
            else:
                print("Twilio client not configured - SMS alerts disabled")

        except Exception as e:
            print(f"SMS sending failed: {e}")

    def get_active_alerts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all active alerts"""
        active_alerts = [alert for alert in self.alerts if alert.get('status') == 'active']
        return sorted(active_alerts, key=lambda x: x['timestamp'], reverse=True)[:limit]

    def update_alert_status(self, alert_id: str, status: str, notes: str = "") -> Dict[str, Any]:
        """Update alert status (acknowledge, resolve, escalate)"""
        for alert in self.alerts:
            if alert['alert_id'] == alert_id:
                alert['status'] = status
                alert['last_updated'] = datetime.now().isoformat()
                if notes:
                    alert['notes'] = notes
                return {"alert_id": alert_id, "status": "updated", "new_status": status}

        return {"error": "Alert not found"}

    def get_alert_statistics(self) -> Dict[str, Any]:
        """Get alert statistics and trends"""
        total_alerts = len(self.alerts)
        active_alerts = len([a for a in self.alerts if a.get('status') == 'active'])
        resolved_alerts = len([a for a in self.alerts if a.get('status') == 'resolved'])

        # Calculate trends (last 7 days)
        week_ago = datetime.now() - timedelta(days=7)
        recent_alerts = [a for a in self.alerts if datetime.fromisoformat(a['timestamp']) > week_ago]

        return {
            "total_alerts": total_alerts,
            "active_alerts": active_alerts,
            "resolved_alerts": resolved_alerts,
            "resolution_rate": (resolved_alerts / total_alerts * 100) if total_alerts > 0 else 0,
            "alerts_last_7_days": len(recent_alerts),
            "avg_alerts_per_day": len(recent_alerts) / 7,
            "high_priority_alerts": len([a for a in self.alerts if a.get('escalation_level') == 'high'])
        }

    def configure_notifications(self, email_subscribers: List[str] = None,
                              sms_subscribers: List[str] = None) -> Dict[str, Any]:
        """Configure notification subscribers"""
        if email_subscribers:
            self.subscribers['email'] = email_subscribers
        if sms_subscribers:
            self.subscribers['sms'] = sms_subscribers

        return {
            "email_subscribers": self.subscribers['email'],
            "sms_subscribers": self.subscribers['sms'],
            "status": "configured"
        }

# Global alert system instance
alert_system = FraudAlertSystem()

def get_alerts(threshold: float = 0.75, limit: int = 50) -> List[Dict[str, Any]]:
    """Get fraud alerts above threshold"""
    return alert_system.get_active_alerts(limit)

def create_fraud_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new fraud alert"""
    return alert_system.create_alert(alert_data)

def update_alert_status(alert_id: str, status: str, notes: str = "") -> Dict[str, Any]:
    """Update alert status"""
    return alert_system.update_alert_status(alert_id, status, notes)


def is_monitoring_active() -> bool:
    """Return whether the alert monitoring background process is active."""
    return alert_system.monitoring_active

def get_alert_statistics() -> Dict[str, Any]:
    """Get alert statistics"""
    return alert_system.get_alert_statistics()

def start_alert_monitoring(threshold: float = 0.75) -> Dict[str, Any]:
    """Start real-time alert monitoring"""
    return alert_system.start_monitoring(threshold)

def stop_alert_monitoring() -> Dict[str, Any]:
    """Stop real-time alert monitoring"""
    return alert_system.stop_monitoring()

def configure_alert_notifications(email_subscribers: List[str] = None,
                                sms_subscribers: List[str] = None) -> Dict[str, Any]:
    """Configure alert notification subscribers"""
    return alert_system.configure_notifications(email_subscribers, sms_subscribers)