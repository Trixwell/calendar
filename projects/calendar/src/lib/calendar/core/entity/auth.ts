import {FormControl} from "@angular/forms";
import {Category, TaskType, TaskTypeDTO} from "./master-task";
import {env} from "../env";
import {TimeSlot} from "./timetable";

export class Token {
    public token: string | null = null;
    public refresh: string | null = null;
    public expired: string | null = null;
}

export interface Chat {
    channel: string;
    external_id: string;
    username: string | null;
}

export class User {
    cr_time: string;
    up_time: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    facebook_link: string | null;
    instagram_link: string | null;
    nickname: string | null;
    second_name: string;
    schedule: Schedule;
    comment: string;
    address: UserAddress;
    color_mode: number | null = null;

    constructor(
        data: UserDTO,
        public categoryList: Category[],
        public taskTypeList: TaskType[],
        public mainProfileImageList: ImageFile[],
        public phonebook: Phone[],
        public timeSlotList: TimeSlot[],
        public progress: ProfileCompletion = new ProfileCompletion([]),
        public chatList: Chat[] = [],
    ) {
        this.cr_time = data.cr_time;
        this.up_time = data.up_time;
        this.username = data.username;
        this.first_name = data.first_name;
        this.last_name = data.last_name;
        this.full_name = data.full_name;
        this.second_name = data.second_name;
        this.comment = data.comment;
        this.schedule = new Schedule(data.schedule);
        this.address = data.address;
        this.nickname = data.nickname;
        this.facebook_link = data.facebook_link;
        this.instagram_link = data.instagram_link;
        this.color_mode = data.color_mode ?? null;
    }

    getTaskTypeByCategory(category: Category): TaskType[] {
        return this.taskTypeList.filter(t => t.category === category.id);
    }

    public getAvatarUrl(
        imageSize: ImageFileSize,
        defaultAvatar = '/assets/icons/default.png'
    ): string {
        return this.mainProfileImageList.length ? this.mainProfileImageList[0].getUrl(imageSize) : defaultAvatar
    }

    public getTimeSlot(taskType: TaskType): TimeSlot[] {
        return this.timeSlotList.filter(item => item.task_type_id == taskType.id);
    }
}

export class Schedule {
    sunday: DaySchedule;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;

    constructor(data: ScheduleDTO) {
        this.sunday = new DaySchedule(data.sunday, 'sunday');
        this.monday = new DaySchedule(data.monday, 'monday');
        this.tuesday = new DaySchedule(data.tuesday, 'tuesday');
        this.wednesday = new DaySchedule(data.wednesday, 'wednesday');
        this.thursday = new DaySchedule(data.thursday, 'thursday');
        this.friday = new DaySchedule(data.friday, 'friday');
        this.saturday = new DaySchedule(data.saturday, 'saturday');
    }

    [key: string]: DaySchedule;
}

export class DaySchedule {
    start_time: string;
    end_time: string;
    start_time_off: string;
    end_time_off: string;
    available_task_list: TaskType[];
    public is_working_day = false;

    constructor(data: DayScheduleDTO, public day: string) {
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.start_time_off = data.start_time_off;
        this.end_time_off = data.end_time_off;
        this.is_working_day = this.start_time !== '' && this.end_time !== '';

        this.available_task_list = data.available_task_list.map(
            item => new TaskType(
                item.id,
                item.cr_time,
                item.up_time,
                item.name,
                item.comment,
                item.category,
                item.charge_amount,
                item.duration,
                item.status,
                item.guaranty_period
            )
        );
    }
}

export interface UserDTO {
    cr_time: string;
    up_time: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    facebook_link: string | null;
    instagram_link: string | null;
    nickname: string | null;
    second_name: string;
    schedule: ScheduleDTO;
    comment: string;
    address: UserAddress;
    color_mode?: number | null;
}

export interface ScheduleDTO {
    sunday: DayScheduleDTO;
    monday: DayScheduleDTO;
    tuesday: DayScheduleDTO;
    wednesday: DayScheduleDTO;
    thursday: DayScheduleDTO;
    friday: DayScheduleDTO;
    saturday: DayScheduleDTO;
}

export interface DayScheduleDTO {
    start_time: string;
    end_time: string;
    start_time_off: string;
    end_time_off: string;
    available_task_list: TaskTypeDTO[];
}

type NestedFormInterface<T, U> = {
    [key in keyof T]: FormControl<U>;
};

export interface LoginData {
    username: string;
    password: string;
}

export type LoginForm = NestedFormInterface<LoginData, string>;

export enum ImageFileSize {
    XL = 12,
    XM = 13,
    XS = 14,
}

export class ImageFile {
    constructor(
        public file: ImageFileItem[]
    ) {
    }

    public getDirectory(): string | null {
        return this.file[0].directory;
    }

    public getComment(): string | null {
        return this.file[0].comment;
    }

    public getUrl(size: ImageFileSize): string {
        //TODO utilize size respective to the client's device
        return this.file[0].getUrl();
    }

    public getHash(): string {
        return this.file[0].hash;
    }
}

export class ImageFileItem {
    constructor(
        public cr_time: string,
        public size: ImageFileSize,
        public path: string,
        public hash: string,
        public category_id?: number,
        public task_type_list?: number[],
        public comment: string | null = null,
        public directory: string | null = null,
    ) {
    }

    public getUrl(): string {
        return env.apiUrl + this.path;
    }
}

export class Phone {
    constructor(
        public id: number,
        public cr_time: string,
        public number: string
    ) {
    }
}

export class UserAddress {
    constructor(
        public id: number,
        public city: string,
        public street: string,
        public house: string,
        public state: string,
        public zip_code: string,
        public coordinates: number[],
        public comment: string,
    ) {
    }
}

export interface ProfileCompletionItemDTO {
    title: string;
    percent: number;
    pass: boolean;
}

export class ProfileCompletionItem {
    constructor(
        public title: string,
        public percent: number,
        public pass: boolean,
    ) {}
}

export class ProfileCompletion {
    constructor(
        public items: ProfileCompletionItem[],
    ) {}

    get totalProgress(): number {
        return this.items.reduce((sum, item) =>
            sum + (item.pass ? item.percent : 0), 0);
    }
}

export class PortfolioItem {
    constructor(
        public comment: string,
        public category: Category,
        public taskTypeList: TaskType[],
        public file: File | ImageFile,
    ) {
    }
}
