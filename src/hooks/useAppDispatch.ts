import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/features/owner/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
