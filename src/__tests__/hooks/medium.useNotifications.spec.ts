import { act, renderHook } from '@testing-library/react';

import { useNotifications } from '../../hooks/useNotifications.ts';
import { Event } from '../../types.ts';
import { formatDate } from '../../utils/dateUtils.ts';
import { parseHM } from '../utils.ts';

// 타이머 활성화
beforeEach(async () => {
  vi.useFakeTimers();
});

const event: Event[] = [
  {
    id: '01',
    title: '팀 회의',
    date: '2025-10-21',
    startTime: '09:00',
    endTime: '12:00',
    description: '주간 팀 미팅',
    location: '회의실 B',
    category: '업무',
    notificationTime: 10,
    repeat: { type: 'none', interval: 0 },
  },
];

it('초기 상태에서는 알림이 없어야 한다', () => {
  const fakeTime = new Date('2025-10-20 08:00');
  const { result } = renderHook(() => useNotifications([]));
  expect(result.current.notifications).toEqual([]);
  expect(result.current.notifiedEvents).toEqual([]);
});

it('지정된 시간이 된 경우 알림이 새롭게 생성되어 추가된다', () => {
  const fakeTime = new Date('2025-10-21 08:45');
  vi.setSystemTime(fakeTime); //지정된 시간 설정

  const { result } = renderHook(() => useNotifications(event));

  //설정한 현재 시간에서 타이머를 이용해 알람 시간 맞추기
  act(() => {
    vi.advanceTimersByTime(5 * 60 * 1000);
  });

  expect(result.current.notifications).toHaveLength(1);
});

it('index를 기준으로 알림을 적절하게 제거할 수 있다', () => {
  const fakeTime = new Date('2025-10-21 08:57');
  vi.setSystemTime(fakeTime);

  const { result } = renderHook(() => useNotifications(event));

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 알람이 생성되어 있는지 확인
  expect(result.current.notifications).toHaveLength(1);

  // 제거
  act(() => {
    result.current.removeNotification(0);
  });

  //제거 검증
  expect(result.current.notifications).toEqual([]);
});

it('이미 알림이 발생한 이벤트에 대해서는 중복 알림이 발생하지 않아야 한다', () => {
  const fakeTime = new Date('2025-10-21 08:57');
  vi.setSystemTime(fakeTime);

  const { result } = renderHook(() => useNotifications(event));

  act(() => {
    vi.advanceTimersByTime(1000);
  });

  // 알람이 생성되어 있는지 확인
  expect(result.current.notifications).toHaveLength(1);
  expect(result.current.notifiedEvents).toHaveLength(1);

  act(() => {
    vi.advanceTimersByTime(2000);
  });

  // 2초뒤에 다시 체크하는게 맞나..?
  expect(result.current.notifiedEvents).toHaveLength(1);
});
