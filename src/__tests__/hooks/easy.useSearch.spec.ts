import { act, renderHook } from '@testing-library/react';

import { useSearch } from '../../hooks/useSearch.ts';
import { Event } from '../../types.ts';

it('검색어가 비어있을 때 모든 이벤트를 반환해야 한다', () => {
  const events: Event[] = [
    {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
    {
      id: '02',
      title: '팀장 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
  ];
  const date = new Date('2025-10-01');
  const { result } = renderHook(() => useSearch(events, date, 'week'));
  expect(result.current.filteredEvents).toHaveLength(2);
});

it('검색어에 맞는 이벤트만 필터링해야 한다', () => {
  const events: Event[] = [
    {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
    {
      id: '02',
      title: '체육대회',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '18:00',
      description: '체육대회',
      location: '인천',
      category: '업무',
      notificationTime: 10,
      repeat: { type: 'none', interval: 0 },
    },
  ];
  const date = new Date('2025-10-01');
  const { result } = renderHook(() => useSearch(events, date, 'week'));

  // 검색어를 체육으로 했을 시
  act(() => {
    result.current.setSearchTerm('체육');
  });

  expect(result.current.filteredEvents[0].description).toBe('체육대회');
});

it('검색어가 제목, 설명, 위치 중 하나라도 일치하면 해당 이벤트를 반환해야 한다', () => {
  const events: Event[] = [
    {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
    {
      id: '02',
      title: '체육대회',
      date: '2025-10-12',
      startTime: '09:00',
      endTime: '18:00',
      description: '체육대회',
      location: '인천',
      category: '업무',
      notificationTime: 10,
      repeat: { type: 'none', interval: 0 },
    },
  ];
  const date = new Date('2025-10-01');
  const { result } = renderHook(() => useSearch(events, date, 'month'));

  // 검색어를 체육으로 했을 시
  act(() => {
    result.current.setSearchTerm('체육');
  });

  expect(result.current.filteredEvents[0].description).toBe('체육대회');
  // 장소 검증을 위해 추가
  expect(result.current.filteredEvents[0].location).toBe('인천');
});

// 월간으로 설정하여 진행
it('현재 뷰(주간/월간)에 해당하는 이벤트만 반환해야 한다', () => {
  const events: Event[] = [
    {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
    {
      id: '02',
      title: '체육대회',
      date: '2025-10-12',
      startTime: '09:00',
      endTime: '18:00',
      description: '체육대회',
      location: '인천',
      category: '업무',
      notificationTime: 10,
      repeat: { type: 'none', interval: 0 },
    },
  ];
  const date = new Date('2025-10-01');
  const { result } = renderHook(() => useSearch(events, date, 'month'));
  expect(result.current.filteredEvents).toHaveLength(2);
});

it("검색어를 '회의'에서 '점심'으로 변경하면 필터링된 결과가 즉시 업데이트되어야 한다", () => {
  const events: Event[] = [
    {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
    {
      id: '02',
      title: '체육대회',
      date: '2025-10-12',
      startTime: '09:00',
      endTime: '18:00',
      description: '체육대회',
      location: '인천',
      category: '업무',
      notificationTime: 10,
      repeat: { type: 'none', interval: 0 },
    },
  ];

  const date = new Date('2025-10-01');
  const { result } = renderHook(() => useSearch(events, date, 'month'));
  act(() => {
    result.current.setSearchTerm('회의');
  });

  expect(result.current.filteredEvents).toHaveLength(1);

  act(() => {
    result.current.setSearchTerm('점심');
  });

  expect(result.current.filteredEvents).toHaveLength(0);
});
