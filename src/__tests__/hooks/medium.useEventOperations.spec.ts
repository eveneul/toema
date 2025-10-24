import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event, EventForm } from '../../types.ts';

const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});


it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {

  const { result } = renderHook(() => useEventOperations(false));

  expect(result.current.events).toEqual([]);

});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {

  setupMockHandlerCreation();
  const { result } = renderHook(() => useEventOperations(false));

  // 새로운 이벤트
  const newEvent: EventForm = {
    title: '2주차 회의',
    date: '2025-10-22',
    startTime: '14:00',
    endTime: '15:00',
    description: '팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  };

  // 상태 변경 후 실행
  await act(async () => {
    result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toHaveLength(1);
  expect(result.current.events[0].title).toBe('2주차 회의');


});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));
  const updateEvent: EventForm = {
    id: '1',
    title: '추가 회의',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '12:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  // 상태 변경 후 실행
  await act(async () => {
    result.current.saveEvent(updateEvent);
  });

  expect(result.current.events[0].title).toBe('추가 회의');
  expect(result.current.events[0].endTime).toBe('12:00');


});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerCreation();
  const { result } = renderHook(() => useEventOperations(false));

  // 새로운 이벤트
  const newEvent: EventForm = {
    id: '1',
    title: '2주차 회의',
    date: '2025-10-22',
    startTime: '14:00',
    endTime: '15:00',
    description: '팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 1,
  };

  // 상태 변경 후 실행
  await act(async () => {
    result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toHaveLength(1);
  expect(result.current.events[0].title).toBe('2주차 회의');


  setupMockHandlerDeletion();

  // 상태 변경 후 실행
  await act(async () => {
    result.current.deleteEvent('1');
  });

  expect(result.current.events).toEqual([]);

});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  // 서버통신 실패 설정
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.error();
    }),
  );

  const { result } = renderHook(() => useEventOperations(false));

  //// fetchEvents 호출
  await act(async () => {
    await result.current.fetchEvents();
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });


});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {

  const { result } = renderHook(() => useEventOperations(true));
  const updateEvent: EventForm = {
    id: '4',
    title: '추가 회의',
    date: '2025-10-15',
    startTime: '09:00',
    endTime: '12:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };


  // 상태 변경 후 실행
  await act(async () => {
    result.current.saveEvent(updateEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });

});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return HttpResponse.error();
    }),
  );

  const { result } = renderHook(() => useEventOperations(true));

  await act(async () => {
    result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });


});

