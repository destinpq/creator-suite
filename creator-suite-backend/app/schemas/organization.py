from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.creator_suite.schemas import AssetType


class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(OrganizationBase):
    pass


class OrganizationInDBBase(OrganizationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Organization(OrganizationInDBBase):
    pass


class GenerationUsageItem(BaseModel):
    """Individual generation usage item for billing"""
    generation_id: str
    user_name: str
    user_email: str
    generation_type: AssetType
    model_used: str
    provider: str
    cost: float
    created_at: datetime
    processing_time_seconds: Optional[float] = None


class OrganizationBill(BaseModel):
    """Organization billing summary with usage details"""
    organization_id: int
    organization_name: str
    billing_period_start: datetime
    billing_period_end: datetime
    total_generations: int
    total_cost: float
    usage_by_type: dict  # AssetType -> count
    usage_by_model: dict  # model_name -> count
    generations: List[GenerationUsageItem]
    
    class Config:
        from_attributes = True