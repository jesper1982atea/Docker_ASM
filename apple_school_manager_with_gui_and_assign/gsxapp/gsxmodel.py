from pydantic import BaseModel
from typing import Optional, List


class Identifiers(BaseModel):
    serial: str
    imei: Optional[str]
    imei2: Optional[str]


class ConsumerLawInfo(BaseModel):
    serviceType: str
    popRequired: bool
    allowedPartType: str


class WarrantyInfo(BaseModel):
    warrantyStatusCode: str
    warrantyStatusDescription: str
    daysRemaining: int
    purchaseDate: str
    registrationDate: str
    onsiteCoverage: bool
    laborCovered: bool
    limitedWarranty: bool
    partCovered: bool
    personalized: bool
    purchaseCountryDesc: str
    purchaseCountryCode: str
    deviceCoverageDetails: List[str]


class Message(BaseModel):
    type: str
    message: str


class ActivationDetails(BaseModel):
    carrierName: Optional[str]
    csncsn2eId: Optional[str]
    lastRestoreDate: Optional[str]
    firstActivationDate: Optional[str]
    unlocked: bool
    unlockDate: Optional[str]
    productVersion: Optional[str]
    initialActivationPolicyID: Optional[str]
    initialActivationPolicyDetails: Optional[str]
    appliedActivationPolicyID: Optional[str]
    appliedActivationDetails: Optional[str]
    nextTetherPolicyID: Optional[str]
    nextTetherPolicyDetails: Optional[str]
    productDescription: Optional[str]
    lastUnbrickOsBuild: Optional[str]


class CaseDetail(BaseModel):
    caseId: str
    createdDateTime: str
    summary: str


class Device(BaseModel):
    identifiers: Identifiers
    productDescription: str
    loaner: bool
    consumerLawInfo: List[ConsumerLawInfo]
    configCode: str
    configDescription: str
    warrantyInfo: WarrantyInfo
    messages: Optional[List[Message]]
    productImageURL: str
    activationDetails: ActivationDetails
    productLine: str
    soldToName: str
    caseDetails: Optional[List[CaseDetail]]


class GSXResponse(BaseModel):
    device: Device