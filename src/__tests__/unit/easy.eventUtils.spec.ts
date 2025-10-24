import { Event } from '../../types';
import { getFilteredEvents } from '../../utils/eventUtils';

describe('getFilteredEvents', () => {

  const events : Event[] =[
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
      repeat: { type: 'none', interval: 0 }
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
      repeat: { type: 'none', interval: 0 }
    },
    {
      id: '03',
      title: '이벤트 2',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 미팅',
      location: '회의실 C',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    },
    {
      id: '04',
      title: '이벤트 3',
      date: '2025-07-02',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 미팅',
      location: '회의실 C',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    },
    {
      id: '05',
      title: '이벤트 4',
      date: '2025-07-11',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 Meeting',
      location: '회의실 C',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    },
    {
      id: '06',
      title: '이벤트 6',
      date: '2025-07-31',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간회의',
      location: '회의실 C',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    }

  ]
  it("검색어 '이벤트 2'에 맞는 이벤트만 반환한다", () => {
    const searchTerm = '이벤트 2'
    const result = getFilteredEvents(events, searchTerm, new Date('2025-10-01'), 'week');


    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: '03',
      title: '이벤트 2',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 미팅',
      location: '회의실 C',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    });
 

  });

  it('주간 뷰에서 2025-07-01 주의 이벤트만 반환한다', () => {
    const currentDate = new Date('2025-07-01');
    const result = getFilteredEvents(events, '', currentDate, 'week');

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual('2025-07-02');

  });

  it('월간 뷰에서 2025년 7월의 모든 이벤트를 반환한다', () => {
    const currentDate = new Date('2025-07-01');
    const result = getFilteredEvents(events, '', currentDate, 'month');

    expect(result).toHaveLength(3);
    expect(result[0].date).toEqual('2025-07-02');
    expect(result[1].date).toEqual('2025-07-11');
    expect(result[2].date).toEqual('2025-07-31');
  });

  it("검색어 '이벤트'와 주간 뷰 필터링을 동시에 적용한다", () => {
    const searchTerm = '이벤트';
    const currentDate = new Date('2025-07-01');
    const result = getFilteredEvents(events, searchTerm, currentDate, 'week');

    expect(result).toHaveLength(1); 
    expect(result[0].title).toBe('이벤트 3');
  });

  // 주간뷰를 추가함
  it('검색어가 없을 때 모든 이벤트를 반환한다', () => {
    const currentDate = new Date('2025-07-01');
    const result = getFilteredEvents(events, '',currentDate, 'week');

    expect(result).toHaveLength(1); 
  });

  // 월간뷰를 추가함
  it('검색어가 대소문자를 구분하지 않고 작동한다', () => {
    const date = new Date('2025-07-01');
    const searchTerm = 'meet'
    const result = getFilteredEvents(events, searchTerm,date, 'month');

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe('주간 Meeting')
  });

  // 월의 경계라는 표현이 애매해 월의 마지막일로 생각하여 작성
  it('월의 경계에 있는 이벤트를 올바르게 필터링한다', () => {
    const date = new Date('2025-07-28');
    const result = getFilteredEvents(events, '',date, 'week');

    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual('2025-07-31');


  });

  it('빈 이벤트 리스트에 대해 빈 배열을 반환한다', () => {
    const date = new Date('2025-07-28');
    const emptyEvent : Event [] = [];
    const result = getFilteredEvents(emptyEvent, '',date, 'week');

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});

