"""
공통 유틸리티 함수
"""
from rest_framework.exceptions import PermissionDenied


def ensure_organization_access(user, resource_organization):
    """
    사용자가 해당 조직의 리소스에 접근할 수 있는지 확인
    
    Args:
        user: 현재 사용자
        resource_organization: 리소스의 소속 조직
        
    Raises:
        PermissionDenied: 접근 권한이 없는 경우
    """
    if user.organization_id != resource_organization.id:
        raise PermissionDenied("You do not have access to this resource.")


def filter_by_organization(queryset, user):
    """
    쿼리셋을 사용자의 조직으로 필터링
    
    Args:
        queryset: 필터링할 쿼리셋
        user: 현재 사용자
        
    Returns:
        필터링된 쿼리셋
    """
    if user.organization:
        return queryset.filter(organization=user.organization)
    return queryset.none()
