import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  CalendarDataProvider,
  CalendarUserProvider,
  MasterTask,
  TaskType,
  ClientInfo,
  TaskStatusEnum,
  TaskPaymentTypeEnum,
  TaskPaymentStatusEnum,
  User,
  UserDTO,
  UserAddress,
  Category,
  TimeSlot,
} from 'calendar';

function makeTaskType(id: number, name: string, category: number, charge = 500): TaskType {
  return new TaskType(id, '', '', name, '', category, charge, '01:30:00', TaskStatusEnum.Active, null);
}

const test1 = makeTaskType(1, 'TestEvent1', 1);
const test2 = makeTaskType(2, 'TestEvent2', 2);
const dayOff = makeTaskType(3, 'Time off', 1);

function iso(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hour)}:${p(minute)}:00`;
}

let nextId = 1;

function makeTask(
  daysFromToday: number,
  hour: number,
  durationMin: number,
  type: TaskType,
  timeSlotId: number,
  clientName: string,
): MasterTask {
  const id = nextId++;
  const start = iso(daysFromToday, hour);
  const end = iso(daysFromToday, hour + Math.floor(durationMin / 60), durationMin % 60);
  return new MasterTask(
    id,
    '',
    '',
    start,
    String(durationMin),
    end,
    end,
    TaskStatusEnum.Assigned,
    1,
    '',
    '',
    type,
    [new ClientInfo(clientName, '+380001112233', id)],
    TaskPaymentTypeEnum.Cash,
    TaskPaymentStatusEnum.NotPaid,
    timeSlotId,
    [type],
  );
}

const SAMPLE_TASKS: MasterTask[] = [
  makeTask(0, 9, 90, test1, 1, "Test User1'"),
  makeTask(0, 13, 60, test2, 2, "Test User2'"),
  makeTask(0, 16, 120, test1, 3, 'Test User3'),
  makeTask(1, 10, 60, test2, 1, 'Test User4'),
  makeTask(2, 11, 90, test1, 2, 'Test User5'),
  makeTask(3, 14, 60, test2, 4, 'Test User6'),
  makeTask(7, 9, 120, test1, 1, 'Test User7'),
  makeTask(10, 15, 60, test2, 2, 'Test User8'),
  makeTask(14, 10, 90, test1, 3, 'Test User9'),
  makeTask(-3, 12, 60, dayOff, 5, 'Test User10'),
  makeTask(21, 13, 90, test2, 1, 'Test User11'),
];

@Injectable({ providedIn: 'root' })
export class MockCalendarDataProvider implements CalendarDataProvider {
  getTasks(_startISO: string, _endISO: string): Observable<MasterTask[]> {
    return of(SAMPLE_TASKS);
  }
}

const workDay = { start_time: '09:00', end_time: '18:00', start_time_off: '', end_time_off: '', available_task_list: [] };
const offDay = { start_time: '', end_time: '', start_time_off: '', end_time_off: '', available_task_list: [] };

const USER_DTO: UserDTO = {
  cr_time: '',
  up_time: '',
  username: 'demo',
  first_name: 'Demo',
  last_name: 'Master',
  full_name: 'Demo Master',
  facebook_link: null,
  instagram_link: null,
  nickname: null,
  second_name: '',
  schedule: {
    monday: workDay,
    tuesday: workDay,
    wednesday: workDay,
    thursday: workDay,
    friday: workDay,
    saturday: offDay,
    sunday: offDay,
  },
  comment: '',
  address: new UserAddress(0, '', '', '', '', '', [], ''),
  color_mode: null,
};

const CATEGORIES: Category[] = [
  new Category(1, '', '', 'Test', '', '#6C7DE6'),
  new Category(2, '', '', 'Test2', '', '#4BB543'),
];

const TASK_TYPES: TaskType[] = [test1, test2, dayOff];

const TIME_SLOTS: TimeSlot[] = [1, 2, 3, 4, 5].map((id) => new TimeSlot(id, '', '00:30', null));

const PROFILE = new User(USER_DTO, CATEGORIES, TASK_TYPES, [], [], TIME_SLOTS);

@Injectable({ providedIn: 'root' })
export class MockCalendarUserProvider implements CalendarUserProvider {
  readonly profile$: Observable<User | null> = of(PROFILE);
}
