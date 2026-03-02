"""Users router."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User, UserRole
from ..schemas import (
    UserResponse,
    UserUpdate,
    CustomerProfileResponse,
    CustomerProfileCreate,
    PlumberProfileResponse,
    PlumberProfileCreate,
    AddInterventionLocationRequest,
)
from ..config import get_settings
from ..services.user import UserService
from ..integrations.stripe import StripeService
from ..utils.deps import get_current_active_user

settings = get_settings()
router = APIRouter(prefix="/users", tags=["Users"])


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """Update current user profile."""
    service = UserService(session)
    user = await service.update_user(
        user_id=current_user.id,
        **data.model_dump(exclude_unset=True),
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/me/customer-profile", response_model=CustomerProfileResponse)
async def get_customer_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get current user's customer profile."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a customer account",
        )

    service = UserService(session)
    profile = await service.get_customer_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found",
        )
    return profile


@router.patch("/me/customer-profile", response_model=CustomerProfileResponse)
async def update_customer_profile(
    data: CustomerProfileCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update current user's customer profile."""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a customer account",
        )

    service = UserService(session)
    profile = await service.update_customer_profile(
        user_id=current_user.id,
        **data.model_dump(exclude_unset=True),
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found",
        )
    return profile


@router.get("/me/plumber-profile", response_model=PlumberProfileResponse)
async def get_plumber_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get current user's plumber profile."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a plumber account",
        )

    service = UserService(session)
    profile = await service.get_plumber_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plumber profile not found",
        )
    return profile


@router.patch("/me/plumber-profile", response_model=PlumberProfileResponse)
async def update_plumber_profile(
    data: PlumberProfileCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update current user's plumber profile."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a plumber account",
        )

    service = UserService(session)
    profile = await service.update_plumber_profile(
        user_id=current_user.id,
        **data.model_dump(exclude_unset=True),
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plumber profile not found",
        )
    return profile


@router.post("/me/plumber-profile/intervention-locations")
async def add_intervention_location(
    data: AddInterventionLocationRequest,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Add an intervention location to plumber profile."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a plumber account",
        )

    service = UserService(session)
    profile = await service.get_plumber_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plumber profile not found",
        )

    locations = profile.intervention_locations or []
    locations.append(data.model_dump())

    updated_profile = await service.update_plumber_profile(
        user_id=current_user.id,
        intervention_locations=locations,
    )

    return {"success": True, "totalLocations": len(locations)}


@router.delete("/me/plumber-profile/intervention-locations/{index}")
async def remove_intervention_location(
    index: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Remove an intervention location from plumber profile."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a plumber account",
        )

    service = UserService(session)
    profile = await service.get_plumber_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plumber profile not found",
        )

    locations = profile.intervention_locations or []
    if index < 0 or index >= len(locations):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid location index",
        )

    locations.pop(index)

    await service.update_plumber_profile(
        user_id=current_user.id,
        intervention_locations=locations,
    )

    return {"success": True, "totalLocations": len(locations)}


@router.post("/plumber/stripe-onboarding")
async def create_stripe_onboarding(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create Stripe Connect account and return onboarding link."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a plumber account",
        )

    service = UserService(session)
    profile = await service.get_plumber_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plumber profile not found",
        )

    stripe_service = StripeService()

    # Create Stripe Connect account if not exists
    if not profile.stripe_account_id:
        account = await stripe_service.create_connect_account(
            email=current_user.email,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            company_name=profile.company_name,
        )
        await service.update_plumber_profile(
            user_id=current_user.id,
            stripe_account_id=account.id,
        )
        account_id = account.id
    else:
        account_id = profile.stripe_account_id

    # Generate onboarding link
    account_link = await stripe_service.create_account_link(
        account_id=account_id,
        refresh_url=f"{settings.FRONTEND_PRO_URL}/onboarding?step=stripe&refresh=true",
        return_url=f"{settings.FRONTEND_PRO_URL}/onboarding?step=stripe&success=true",
    )

    return {"url": account_link.url}


@router.get("/plumber/stripe-status")
async def get_stripe_status(
    current_user: Annotated[User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get plumber's Stripe Connect account status."""
    if current_user.role != UserRole.PLUMBER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a plumber account",
        )

    service = UserService(session)
    profile = await service.get_plumber_profile(current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plumber profile not found",
        )

    return {
        "hasAccount": bool(profile.stripe_account_id),
        "onboardingComplete": profile.stripe_onboarding_complete,
        "chargesEnabled": profile.stripe_charges_enabled,
        "payoutsEnabled": profile.stripe_payouts_enabled,
    }
