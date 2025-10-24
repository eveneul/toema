import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';
import { wait } from '@testing-library/user-event/dist/cjs/utils/index.js';

const theme = createTheme();

// ! HINT. 이 유틸을 사용해 리액트 컴포넌트를 렌더링해보세요.
const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  // ? Medium: 여기서 Provider로 묶어주는 동작은 의미있을까요? 있다면 어떤 의미일까요? => ???
  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

// ! HINT. 이 유틸을 사용해 일정을 저장해보세요.
const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  await user.click(screen.getByTestId('event-submit-button'));
};

// ! HINT. "검색 결과가 없습니다"는 초기에 노출되는데요. 그럼 검증하고자 하는 액션이 실행되기 전에 검증해버리지 않을까요? 이 테스트를 신뢰성있게 만드려면 어떻게 할까요?
describe('일정 CRUD 및 기본 기능', () => {
  it('입력한 새로운 일정 정보에 맞춰 모든 필드가 이벤트 리스트에 정확히 저장된다.', async () => {
    // ! HINT. event를 추가 제거하고 저장하는 로직을 잘 살펴보고, 만약 그대로 구현한다면 어떤 문제가 있을 지 고민해보세요.

    setupMockHandlerCreation();

    const newEvent = {
      id: '3',
      title: '회식',
      date: '2025-10-22',
      startTime: '09:00',
      endTime: '10:00',
      description: '사전 미팅',
      location: '회의실 A',
      category: '업무',
    };

    const { user } = setup(<App />);
    await saveSchedule(user, newEvent);
    await waitFor(() => {

      const eventTitle = within(screen.getByRole('table')).getByText('회식');
      expect(eventTitle).toBeInTheDocument();
    });
  });


  it('기존 일정의 세부 정보를 수정하고 변경사항이 정확히 반영된다', async () => {
    setupMockHandlerUpdating();
    // 수정아이콘 클릭 => 일정이 여러개니 수정 아이콘도 여러개인걸 생각
    // 테이블 내용 수정
    // 다시 저장
    const { user } = setup(<App />);
    const updateButtons = await screen.findAllByRole('button', { name: 'Edit event' });
    await user.click(updateButtons[0]);

    await user.clear(screen.getByLabelText('제목'));
    await user.type(screen.getByLabelText('제목'), '수정된 회의');
    await user.click(screen.getByTestId('event-submit-button'));
    // 이렇게 검사하는게 맞나?
    await waitFor(() => {
      expect(screen.getAllByText('수정된 회의')[0]).toBeInTheDocument();
    });
  });

  it('일정을 삭제하고 더 이상 조회되지 않는지 확인한다', async () => {
    // 현재 일정 목록 확인
    // 첫번쨰 일정 가져와서 삭제
    // 테스트
    const { user } = setup(<App />);

    const eventList = within(screen.getByTestId('event-list'));

    const searchInput = screen.getByLabelText('일정 검색');
    await user.type(searchInput, '기존 회의');

    // 이벤트가 있는지 체크
    expect(eventList.getByText('기존 회의')).toBeInTheDocument();

    //삭제 =>검색어가 입력되어 있는 상태
    const deleteButton = eventList.getByRole('button', { name: 'Delete event' });

    await user.click(deleteButton);

    // 검색어 삭제안하고 하려니 eventList를 못불러오는 이슈
    await user.clear(searchInput);

    // 삭제되는 작업 
    await waitFor(() => {
      expect(eventList.queryByText('검색 결과가 없습니다.')).not.toBeInTheDocument();
    });
  });
});

describe('일정 뷰', () => {
  it('주별 뷰를 선택 후 해당 주에 일정이 없으면, 일정이 표시되지 않는다.', async () => {
    const { user } = setup(<App />);
    vi.useFakeTimers().setSystemTime('2025-12-01');

    const type = screen.getByLabelText('뷰 타입 선택');
    // type을 클릭하고 바로 week를 누르도록 하면 week-option을 못찾음 => 왜?
    const combo = within(type).getByRole('combobox');
    await user.click(combo);

    const week = await screen.getByLabelText('week-option');
    await user.click(week);

    const eventList = within(screen.getByTestId('event-list'));

    expect(eventList.queryByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('주별 뷰 선택 후 해당 일자에 일정이 존재한다면 해당 일정이 정확히 표시된다', async () => {
    const mockEvent: Event = {
      id: '1',
      title: '회식',
      date: '2025-10-21',
      startTime: '18:00',
      endTime: '23:00',
      description: '추가업무',
      location: '1층',
      category: '기타',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    };

    setupMockHandlerCreation([mockEvent]);
    vi.useFakeTimers().setSystemTime('2025-10-21');
    const { user } = setup(<App />);

    const view = screen.getByLabelText('뷰 타입 선택');
    const combo = within(view).getByRole('combobox');
    await user.click(combo);

    const week = screen.getByLabelText('week-option');
    await user.click(week);

    const eventList = within(screen.getByTestId('event-list'));

    expect(eventList.getByText('회식')).toBeInTheDocument();
    expect(eventList.getByText('2025-10-21')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 없으면, 일정이 표시되지 않아야 한다.', async () => {
    vi.useFakeTimers().setSystemTime('2026-01-01');
    const { user } = setup(<App />);
    const type = screen.getByLabelText('뷰 타입 선택');
    const combo = within(type).getByRole('combobox');
    await user.click(combo);

    const month = await screen.getByLabelText('month-option');
    await user.click(month);

    const eventList = within(screen.getByTestId('event-list'));

    expect(eventList.queryByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it('월별 뷰에 일정이 정확히 표시되는지 확인한다', async () => {
    const mockEvent: Event = {
      id: '7',
      title: '독서모임',
      date: '2025-10-20',
      startTime: '18:00',
      endTime: '23:00',
      description: '월간 모임',
      location: '2층 카페',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    };

    vi.useFakeTimers().setSystemTime('2025-10-22');
    setupMockHandlerCreation([mockEvent]);

    const { user } = setup(<App />);
    const type = screen.getByLabelText('뷰 타입 선택');
    const combo = within(type).getByRole('combobox');
    await user.click(combo);

    const month = await screen.getByLabelText('month-option');
    await user.click(month);

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText('독서모임')).toBeInTheDocument();

  });

  it('달력에 1월 1일(신정)이 공휴일로 표시되는지 확인한다', async () => {
    vi.useFakeTimers().setSystemTime('2025-01-01');

    const { user } = setup(<App />);
    const type = screen.getByLabelText('뷰 타입 선택');
    const combo = within(type).getByRole('combobox');
    await user.click(combo);

    const month = await screen.getByLabelText('month-option');
    await user.click(month);

    const holidays = screen.getByTestId('month-view');
    expect(within(holidays).getByText('신정')).toBeInTheDocument();

  });
});

describe('검색 기능', () => {
  it('검색 결과가 없으면, "검색 결과가 없습니다."가 표시되어야 한다.', async () => {
    const { user } = setup(<App />);

    const eventList = within(screen.getByTestId('event-list'));

    const searchInput = screen.getByLabelText('일정 검색');
    await user.type(searchInput, '퇴사');

    expect(eventList.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });

  it("'팀 회의'를 검색하면 해당 제목을 가진 일정이 리스트에 노출된다", async () => {
    const mockEvent: Event = {
      id: '8',
      title: '팀 회의',
      date: '2025-10-20',
      startTime: '11:00',
      endTime: '15:00',
      description: '월간 회의',
      location: '2층 강당',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    };

    vi.useFakeTimers().setSystemTime('2025-10-22');
    setupMockHandlerCreation([mockEvent]);
    const { user } = setup(<App />);

    const eventList = within(screen.getByTestId('event-list'));

    const searchInput = screen.getByLabelText('일정 검색');
    await user.type(searchInput, '팀 회의');

    expect(eventList.getByText('팀 회의')).toBeInTheDocument();
  });

  it('검색어를 지우면 모든 일정이 다시 표시되어야 한다', async () => {
    const mockEvent: Event[] = [{
      id: '8',
      title: '팀 회의',
      date: '2025-10-20',
      startTime: '11:00',
      endTime: '15:00',
      description: '월간 회의',
      location: '2층 강당',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
    {
      id: '9',
      title: '협업',
      date: '2025-10-24',
      startTime: '14:00',
      endTime: '15:00',
      description: '보고회',
      location: '회의실 A',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    }];

    vi.useFakeTimers().setSystemTime('2025-10-22');
    setupMockHandlerCreation(mockEvent);
    const { user } = setup(<App />);

    const eventList = within(screen.getByTestId('event-list'));

    const searchInput = screen.getByLabelText('일정 검색');
    await user.type(searchInput, '팀 회의');

    expect(eventList.queryByText('협업')).not.toBeInTheDocument();

    await user.clear(searchInput);

    await waitFor(() => {
      expect(eventList.getByText('협업')).toBeInTheDocument();
    });
  });
});

describe('일정 충돌', () => {
  it('겹치는 시간에 새 일정을 추가할 때 경고가 표시된다', async () => {
    const mockEvent: Event = {
      id: '10',
      title: '1팀 회의',
      date: '2025-10-20',
      startTime: '11:00',
      endTime: '15:00',
      description: '월간 회의',
      location: '2층 강당',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    };

    vi.useFakeTimers().setSystemTime('2025-10-22');
    setupMockHandlerCreation([mockEvent]);
    const { user } = setup(<App />);

    await user.type(screen.getByLabelText('제목'), '2팀 회의');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '11:00');
    await user.type(screen.getByLabelText('종료 시간'), '15:00');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();

  });

  it('기존 일정의 시간을 수정하여 충돌이 발생하면 경고가 노출된다', async () => {
    const mockEvent: Event[] = [{
      id: '11',
      title: '1팀 회의',
      date: '2025-10-20',
      startTime: '11:00',
      endTime: '15:00',
      description: '월간 회의',
      location: '2층 대회의실',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    },
    {
      id: '12',
      title: '3팀 회의',
      date: '2025-10-20',
      startTime: '16:00',
      endTime: '18:00',
      description: '월간 회의',
      location: '3층 대회의실',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 1,
    }
    ];

    vi.useFakeTimers().setSystemTime('2025-10-22');
    setupMockHandlerCreation(mockEvent);
    const { user } = setup(<App />);

    // 검색어 설정
    const eventList = within(screen.getByTestId('event-list'));
    const editButtons = await eventList.findAllByLabelText('Edit event');

    const updateEvent = editButtons[0];
    await user.click(updateEvent);

    await user.clear(screen.getByLabelText('시작 시간'));
    await user.clear(screen.getByLabelText('종료 시간'));
    await user.type(screen.getByLabelText('시작 시간'), '16:00');
    await user.type(screen.getByLabelText('종료 시간'), '18:00');

    await user.click(screen.getByTestId('event-submit-button'));

    expect(screen.getByText('일정 겹침 경고')).toBeInTheDocument();
  });
});

it('notificationTime을 10으로 하면 지정 시간 10분 전 알람 텍스트가 노출된다', async () => {
  const mockEvent: Event = {
    id: '13',
    title: '8팀 회의',
    date: '2025-10-24',
    startTime: '11:00',
    endTime: '15:00',
    description: '월간 회의',
    location: '2층 강당',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  setupMockHandlerCreation([mockEvent]);
  const { user } = setup(<App />);
  // 15분전으로 타임 세팅
  vi.useFakeTimers().setSystemTime(new Date('2025-10-24T10:45:00.000Z'));

  // 5분 후 알람시간
  //vi.advanceTimersByTime(5 * 60 * 1000); 이것만 작성하니 act를 사용하라는 경고 뜸

  await act(async () => {
    vi.advanceTimersByTime(5 * 60 * 1000); // 5분후 설정
  });
  const nextNotice = await screen.findByText('10분 후 8팀 회의 일정이 시작됩니다.');
  expect(nextNotice).toBeInTheDocument();
});
