import React from 'react';
import { render } from '@testing-library/react-native';
import {
  SkeletonLoader,
  CardSkeleton,
  DashboardHeaderSkeleton,
  DashboardMetricsSkeleton,
  DashboardAttentionSkeleton,
  DashboardMonthlyMetricsSkeleton,
} from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders with default props', () => {
    const { toJSON } = render(<SkeletonLoader />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom width and height', () => {
    const { toJSON } = render(<SkeletonLoader width={200} height={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with string width', () => {
    const { toJSON } = render(<SkeletonLoader width="80%" height={30} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders without shimmer', () => {
    const { toJSON } = render(<SkeletonLoader shimmer={false} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom borderRadius', () => {
    const { toJSON } = render(<SkeletonLoader borderRadius={12} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('CardSkeleton', () => {
  it('renders with default width', () => {
    const { toJSON } = render(<CardSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with custom width', () => {
    const { toJSON } = render(<CardSkeleton width={200} />);
    expect(toJSON()).toBeTruthy();
  });
});

describe('Dashboard skeletons', () => {
  it('DashboardHeaderSkeleton renders', () => {
    const { toJSON } = render(<DashboardHeaderSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('DashboardMetricsSkeleton renders', () => {
    const { toJSON } = render(<DashboardMetricsSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('DashboardAttentionSkeleton renders', () => {
    const { toJSON } = render(<DashboardAttentionSkeleton />);
    expect(toJSON()).toBeTruthy();
  });

  it('DashboardMonthlyMetricsSkeleton renders', () => {
    const { toJSON } = render(<DashboardMonthlyMetricsSkeleton />);
    expect(toJSON()).toBeTruthy();
  });
});
