import { Event } from '../../types';
import { createNotificationMessage, getUpcomingEvents } from '../../utils/notificationUtils';

describe('getUpcomingEvents', () => {
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
      date: '2025-10-03',
      startTime: '09:00',
      endTime: '12:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      notificationTime: 10,
      repeat: { type: 'none', interval: 0 }
    }
  ]
  it('알림 시간이 정확히 도래한 이벤트를 반환한다', () => {
    const now = new Date('2025-10-03T08:50:00.000Z'); 
    const result = getUpcomingEvents(events, now, []);
    expect(result[0].startTime).toBe('09:00');
  });

  it('이미 알림이 간 이벤트는 제외한다', () => {
    const now = new Date('2025-10-02T23:55:00.000Z');
    const result = getUpcomingEvents(events,now,['02']);

    expect(result).toEqual([]);

  });

  it('알림 시간이 아직 도래하지 않은 이벤트는 반환하지 않는다', () => {
    const now = new Date('2025-10-02T23:30:00.000Z');
    const result = getUpcomingEvents(events,now,[]);
    expect(result).toEqual([]);

  });

  // 이미 알림이 간 이벤트와 같은 얘기라고 생각해 동일하게 작성
  it('알림 시간이 지난 이벤트는 반환하지 않는다', () => {
    const now = new Date('2025-10-02T23:55:00.000Z');
    const result = getUpcomingEvents(events,now,['02']);

    expect(result).toEqual([]);
  });
});

describe('createNotificationMessage', () => {
  const event: Event =
    {
      id: '02',
      title: '팀장 회의',
      date: '2025-10-03',
      startTime: '09:00',
      endTime: '12:00',
      description: '팀 미팅',
      location: '회의실 A',
      category: '업무',
      notificationTime: 10,
      repeat: { type: 'none', interval: 0 }
    }
  
  it('올바른 알림 메시지를 생성해야 한다', () => {
    const result = createNotificationMessage(event);
    expect(result).toBe('10분 후 팀장 회의 일정이 시작됩니다.');

  });
});

