import { Event } from '../../types';
import {
  convertEventToDateRange,
  findOverlappingEvents,
  isOverlapping,
  parseDateTime,
} from '../../utils/eventOverlap';

describe('parseDateTime', () => {
  it('2025-07-01 14:30을 정확한 Date 객체로 변환한다', () => {
    const result = parseDateTime('2025-07-01', '14:30');
    expect(result).toEqual(new Date('2025-07-01T14:30:00.000Z'));
  });

  it('잘못된 날짜 형식에 대해 Invalid Date를 반환한다', () => {
    const result = parseDateTime('2025-13-01', '14:30');
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('잘못된 시간 형식에 대해 Invalid Date를 반환한다', () => {
    const result = parseDateTime('2025/7/1', '25:30');
    expect(isNaN(result.getTime())).toBe(true);
  });

  it('날짜 문자열이 비어있을 때 Invalid Date를 반환한다', () => {
    const result = parseDateTime('', '14:30');
    expect(isNaN(result.getTime())).toBe(true);
  });
});

describe('convertEventToDateRange', () => {
  const events: Event[] = [{
    id: '01',
    title: '팀 회의',
    date: '2025-10-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 1,
    repeat: { type: 'none', interval: 0 }
  }];

  it('일반적인 이벤트를 올바른 시작 및 종료 시간을 가진 객체로 변환한다', () => {
    const result = convertEventToDateRange(events[0]);
    expect(result).toEqual({
      start: new Date('2025-10-01T10:00:00.000Z'),
      end: new Date('2025-10-01T11:00:00.000Z')
    });
  });

  it('잘못된 날짜 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const event: Event = {
      id: '01',
      title: '팀 회의',
      date: '2025-13-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    }

    const result = convertEventToDateRange(event);
    expect(isNaN(result.start.getTime())).toBe(true);
  });

  it('잘못된 시간 형식의 이벤트에 대해 Invalid Date를 반환한다', () => {
    const event: Event = {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '25:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    }

    const result = convertEventToDateRange(event);
    expect(isNaN(result.end.getTime())).toBe(true);
  });
});

describe('isOverlapping', () => {
  const events: Event[] = [{
    id: '01',
    title: '팀 회의',
    date: '2025-10-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 1,
    repeat: { type: 'none', interval: 0 }
  },
  {
    id: '02',
    title: '팀 회의',
    date: '2025-10-01',
    startTime: '09:00',
    endTime: '12:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 1,
    repeat: { type: 'none', interval: 0 }
  },
  {
    id: '03',
    title: '팀 회의',
    date: '2025-10-01',
    startTime: '12:00',
    endTime: '14:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 1,
    repeat: { type: 'none', interval: 0 }
  }];

  it('두 이벤트가 겹치는 경우 true를 반환한다', () => {
    const result = isOverlapping(events[0], events[1]);
    expect(result).toBe(true);

  });

  it('두 이벤트가 겹치지 않는 경우 false를 반환한다', () => {
    const result = isOverlapping(events[1], events[2]);
    expect(result).toBe(false);
  });
});

describe('findOverlappingEvents', () => {
  const events: Event[] = [{
    id: '01',
    title: '팀 회의',
    date: '2025-10-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    notificationTime: 1,
    repeat: { type: 'none', interval: 0 }
  }]

  it('새 이벤트와 겹치는 모든 이벤트를 반환한다', () => {
    const newEvent: Event = {
      id: '02',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    }
    const result = findOverlappingEvents(newEvent, events);
    expect(result).toHaveLength(1);
    expect(result).toEqual([{
      "category": "업무",
      "date": "2025-10-01",
      "description": "주간 팀 미팅",
      "endTime": "11:00",
      "id": "01",
      "location": "회의실 A",
      "notificationTime": 1,
      "repeat": {
        "interval": 0,
        "type": "none",
      },
      "startTime": "10:00",
      "title": "팀 회의",
    }]);


  });

  it('겹치는 이벤트가 없으면 빈 배열을 반환한다', () => {
    const newEvent: Event = {
      id: '02',
      title: '팀 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '12:00',
      description: '주간 팀 미팅',
      location: '회의실 B',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 }
    }
    const result = findOverlappingEvents(newEvent, events);
    expect(result).toHaveLength(0)
    expect(result).toEqual([]);


  });
});

