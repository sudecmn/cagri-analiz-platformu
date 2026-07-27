from enum import Enum


class UserRole(str, Enum):
    agent = "agent"
    supervisor = "supervisor"
    admin = "admin"
