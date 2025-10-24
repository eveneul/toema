import { isDate } from 'util/types';

import { Event } from '../../types';
import {
  fillZero,
  formatDate,
  formatMonth,
  formatWeek,
  getDaysInMonth,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
  isDateInRange,
} from '../../utils/dateUtils';

describe('getDaysInMonth', () => {
  const currentYear = new Date().getFullYear();

  it('1월은 31일 수를 반환한다', () => {
    const result = getDaysInMonth(currentYear, 1);
    expect(result).toBe(31);
  });

  it('4월은 30일 일수를 반환한다', () => {
    const result = getDaysInMonth(currentYear, 4);
    expect(result).toBe(30);
  });

  it('윤년의 2월에 대해 29일을 반환한다', () => {
    const lastYear = new Date().getFullYear() - 1;
    const leapYear = (lastYear % 4 === 0 && lastYear % 100 !== 0) || lastYear % 400 === 0;

    expect(leapYear).toBe(true);

    const result = getDaysInMonth(lastYear, 2);
    expect(result).toBe(29);
  });

  it('평년의 2월에 대해 28일을 반환한다', () => {
    const leapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;

    expect(leapYear).toBe(false);

    const result = getDaysInMonth(currentYear, 2);
    expect(result).toBe(28);
  });

  it('유효하지 않은 월에 대해 적절히 처리한다', () => {
    // 유효하지않은 월을 유효한 월로 바꾸는 로직이 필요할 것 같다.
    const invalidMonth = getDaysInMonth(currentYear, 13);
    expect(invalidMonth).toBe(31);
  });
});

describe('getWeekDates', () => {
  it('주중의 날짜(수요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const fakeDate = '2025-10-21';
    const wednesday = new Date(fakeDate);

    const weekDates = getWeekDates(wednesday);

    expect(weekDates).toHaveLength(7);
  });

  it('주의 시작(월요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const fakeDate = '2025-10-20';
    const wednesday = new Date(fakeDate);

    const weekDates = getWeekDates(wednesday);

    expect(weekDates).toHaveLength(7);
  });

  it('주의 끝(일요일)에 대해 올바른 주의 날짜들을 반환한다', () => {
    const fakeDate = '2025-10-19';
    const sunday = new Date(fakeDate);

    const weekDates = getWeekDates(sunday);

    expect(weekDates).toHaveLength(7);
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연말)', () => {
    const fakeDate = '2024-12-31';
    const lastweek = new Date(fakeDate);

    const weekDates = getWeekDates(lastweek);

    expect(weekDates).toHaveLength(7);
  });

  it('연도를 넘어가는 주의 날짜를 정확히 처리한다 (연초)', () => {
    const fakeDate = '2025-01-01';
    const firstweek = new Date(fakeDate);

    const weekDates = getWeekDates(firstweek);

    expect(weekDates).toHaveLength(7);
  });

  it('윤년의 2월 29일을 포함한 주를 올바르게 처리한다', () => {
    const fakeDate = '2024-02-26';
    const february = new Date(fakeDate);

    const weekDates = getWeekDates(february);

    expect(weekDates).toHaveLength(7);
  });

  it('월의 마지막 날짜를 포함한 주를 올바르게 처리한다', () => {
    const fakeDate = '2025-09-29';
    const month = new Date(fakeDate);
    const weekDates = getWeekDates(month);
    expect(weekDates).toHaveLength(7);
  });
});

describe('getWeeksAtMonth', () => {
  it('2025년 7월 1일의 올바른 주 정보를 반환해야 한다', () => {
    const fakeDate = '2025-07-1';
    const current = new Date(fakeDate);
    const week = getWeeksAtMonth(current);
    expect(week[0]).toEqual([null, null, 1, 2, 3, 4, 5]);
  });
});

describe('getEventsForDay', () => {
  const events: Event[] = [
    {
      id: '01',
      title: '팀 회의',
      date: '2025-10-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '주간 팀 미팅',
      location: '회의실 A',
      category: '업무',
      notificationTime: 1,
      repeat: { type: 'none', interval: 0 },
    },
  ];

  it('특정 날짜(1일)에 해당하는 이벤트만 정확히 반환한다', () => {
    const result = getEventsForDay(events, 1);
    expect(result).toHaveLength(1);
    expect(result[0].date).toEqual('2025-10-01');
  });

  // 해당 날짜를 10월 2일로 설정한 경우
  it('해당 날짜에 이벤트가 없을 경우 빈 배열을 반환한다', () => {
    const result = getEventsForDay(events, 2);
    expect(result).toHaveLength(0);
  });

  it('날짜가 0일 경우 빈 배열을 반환한다', () => {
    const result = getEventsForDay(events, 0);
    expect(result).toHaveLength(0);
  });

  it('날짜가 32일 이상인 경우 빈 배열을 반환한다', () => {
    const result = getEventsForDay(events, 33);
    expect(result).toHaveLength(0);
  });
});

describe('formatWeek', () => {
  it('월의 중간 날짜에 대해 올바른 주 정보를 반환한다', () => {
    const fakedate = new Date('2025-10-15');
    const result = formatWeek(fakedate);
    expect(result).toBe('2025년 10월 3주');
  });

  it('월의 첫 주에 대해 올바른 주 정보를 반환한다', () => {
    const fakedate = new Date('2025-10-01');
    const result = formatWeek(fakedate);
    expect(result).toBe('2025년 10월 1주');
  });

  it('월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const fakedate = new Date('2025-10-31');
    const result = formatWeek(fakedate);
    expect(result).toBe('2025년 10월 5주');
  });

  it('연도가 바뀌는 주에 대해 올바른 주 정보를 반환한다', () => {
    const fakedate = new Date('2024-12-31');
    const result = formatWeek(fakedate);
    expect(result).toBe('2025년 1월 1주');
  });

  it('윤년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const fakedate = new Date('2024-02-29');
    const result = formatWeek(fakedate);
    expect(result).toBe('2024년 2월 5주');
  });

  it('평년 2월의 마지막 주에 대해 올바른 주 정보를 반환한다', () => {
    const fakedate = new Date('2025-02-31');
    const result = formatWeek(fakedate);
    expect(result).toBe('2025년 3월 1주');
  });
});

describe('formatMonth', () => {
  it("2025년 7월 10일을 '2025년 7월'로 반환한다", () => {
    const fakedate = new Date('2025-07-10');
    const result = formatMonth(fakedate);
    expect(result).toBe('2025년 7월');
  });
});

describe('isDateInRange', () => {
  const rangeStart = new Date('2025-07-01');
  const rangeEnd = new Date('2025-07-31');

  it('범위 내의 날짜 2025-07-10에 대해 true를 반환한다', () => {
    const date = new Date('2025-07-10');
    const result = isDateInRange(date, rangeStart, rangeEnd);
    expect(result).toBe(true);
  });

  it('범위의 시작일 2025-07-01에 대해 true를 반환한다', () => {
    const date = new Date('2025-07-01');
    const result = isDateInRange(date, rangeStart, rangeEnd);
    expect(result).toBe(true);
  });

  it('범위의 종료일 2025-07-31에 대해 true를 반환한다', () => {
    const date = new Date('2025-07-31');
    const result = isDateInRange(date, rangeStart, rangeEnd);
    expect(result).toBe(true);
  });

  // 2025 07 01 기준으로 이전날짜 인 2024년도로 수정
  it('범위 이전의 날짜 2024-12-30에 대해 false를 반환한다', () => {
    const date = new Date('2024-12-30');
    const result = isDateInRange(date, rangeStart, rangeEnd);
    expect(result).toBe(false);
  });

  it('범위 이후의 날짜 2025-08-01에 대해 false를 반환한다', () => {
    const date = new Date('2025-08-01');
    const result = isDateInRange(date, rangeStart, rangeEnd);
    expect(result).toBe(false);
  });

  it('시작일이 종료일보다 늦은 경우 모든 날짜에 대해 false를 반환한다', () => {
    const invalidRangeStart = new Date('2025-07-31');
    const invalidRangeEnd = new Date('2025-07-01');
    const date = new Date('2025-07-15');
    const result = isDateInRange(date, invalidRangeStart, invalidRangeEnd);
    expect(result).toBe(false);
  });
});

describe('fillZero', () => {
  it("5를 2자리로 변환하면 '05'를 반환한다", () => {
    const result = fillZero(5, 2);
    expect(result).toBe('05');
  });

  it("10을 2자리로 변환하면 '10'을 반환한다", () => {
    const result = fillZero(10, 2);
    expect(result).toBe('10');
  });

  it("3을 3자리로 변환하면 '003'을 반환한다", () => {
    const result = fillZero(3, 3);
    expect(result).toBe('003');
  });

  it("100을 2자리로 변환하면 '100'을 반환한다", () => {
    const result = fillZero(100, 2);
    expect(result).toBe('100');
  });

  it("0을 2자리로 변환하면 '00'을 반환한다", () => {
    const result = fillZero(0, 2);
    expect(result).toBe('00');
  });

  it("1을 5자리로 변환하면 '00001'을 반환한다", () => {
    const result = fillZero(1, 5);
    expect(result).toBe('00001');
  });

  it("소수점이 있는 3.14를 5자리로 변환하면 '03.14'를 반환한다", () => {
    const result = fillZero(3.14, 5);
    expect(result).toBe('03.14');
  });

  it('size 파라미터를 생략하면 기본값 2를 사용한다', () => {
    const result = fillZero(3);
    expect(result).toBe('03');
  });

  it('value가 지정된 size보다 큰 자릿수를 가지면 원래 값을 그대로 반환한다', () => {
    const result = fillZero(1111, 2);
    expect(result).toBe('1111');
  });
});

describe('formatDate', () => {
  it('날짜를 YYYY-MM-DD 형식으로 포맷팅한다', () => {
    const date = new Date('2025-10-22');
    const result = formatDate(date);
    expect(result).toBe('2025-10-22');
  });

  it('day 파라미터가 제공되면 해당 일자로 포맷팅한다', () => {
    const date = new Date('2025-10-22');
    const result = formatDate(date, 15);
    expect(result).toBe('2025-10-15');
  });

  it('월이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const date = new Date('2025-1-22');
    const result = formatDate(date);
    expect(result).toBe('2025-01-22');
  });

  it('일이 한 자리 수일 때 앞에 0을 붙여 포맷팅한다', () => {
    const date = new Date('2025-10-1');
    const result = formatDate(date);
    expect(result).toBe('2025-10-01');
  });
});
