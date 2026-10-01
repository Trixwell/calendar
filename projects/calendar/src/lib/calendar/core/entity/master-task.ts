import {FormControl} from "@angular/forms";
import {ImageFile, ImageFileItem} from "./auth";
import {TimeSlot} from "./timetable";
import type {CalendarLabels} from "../../../i18n/calendar-labels";
import {LABELS_UK} from "../../../i18n/labels.uk";

const DAY_STATUS_COMMENT_CODES = new Set(['dayOff', 'vacation', 'sick', 'partial']);

export class Category {
    constructor(
        public id: number,
        public cr_time: string,
        public up_time: string,
        public name: string,
        public description: string,
        public color: string | null,
    ) {
    }
}

export class CategoryDTO {
    constructor(
        public name: string,
        public description: string,
        public color: string | null
    ) {
    }
}

export class TaskTypeDTO {
    constructor(
        public id: number,
        public cr_time: string,
        public up_time: string,
        public name: string,
        public comment: string,
        public category: number,
        public charge_amount: number,
        public duration: string,
        public status: TaskStatusEnum,
        public guaranty_period: number | null,
    ) {
    }
}

export class TaskType {
    constructor(
        public id: number,
        public cr_time: string,
        public up_time: string,
        public name: string,
        public comment: string,
        public category: number,
        public charge_amount: number,
        public duration: string,
        public status: TaskStatusEnum,
        public guaranty_period: number | null
    ) {
    }

    public isTimeOff(): boolean {
        return this.name.toLowerCase() == "time off";
    }
}

export enum TaskStatusEnum {
    Active = 1,
    Inactive = 2,
    New = 3,
    Assigned = 4,
    Cancelled = 5,
    Completed = 6,
    Deleted = 7,
}

export enum TaskPaymentTypeEnum {
    Cash = 1,
    CashTerminal = 2,
    Online = 3
}

export enum TaskPaymentStatusEnum {
    Paid = 4,
    NotPaid = 5,
    Refund = 6,
    InProgress = 7,
}

export interface MasterTaskDTO {
    id: number,
    cr_time: string,
    up_time: string,
    assign_time: string,
    duration: string,
    end_time: string,
    approximate_end_time: string,
    status: number,
    cr_user_id: number,
    comment: string,
    close_comment: string,
    payment_type: TaskPaymentTypeEnum,
    payment_status: TaskPaymentStatusEnum,
    time_slot_id: number,
}

export class MasterTask {
    constructor(
        public id: number,
        public cr_time: string,
        public up_time: string,
        public assign_time: string,
        public duration: string,
        public end_time: string,
        public approximate_end_time: string,
        public status: TaskStatusEnum,
        public cr_user_id: number,
        public comment: string,
        public close_comment: string,
        public taskType: TaskType,
        public clientList: ClientInfo[],
        public payment_type: TaskPaymentTypeEnum,
        public payment_status: TaskPaymentStatusEnum,
        public time_slot_id: number,
        public taskTypeList: TaskType[]
    ) {
    }

    public getTitle(labels: CalendarLabels = LABELS_UK): string {
        if (!this.taskType.isTimeOff()) return this.taskType.name;
        return DAY_STATUS_COMMENT_CODES.has(this.comment) ? labels['task.dayOff'] : labels['task.blockedTime'];
    }
}

export interface TaskItemDTO {
    task: MasterTaskDTO;
    time_slot: TimeSlot;
    client_data: ClientInfoDTO[];
    task_type_list: TaskTypeDTO[];
    image_list: ImageFileItem[][];
    image_complete_list: ImageFileItem[][];
}

export class TaskItem {
    constructor(
        public task: MasterTask,
        public time_slot: TimeSlot,
        public task_type_list: TaskType[],
        public image_list: ImageFile[],
        public image_complete_list: ImageFile[]
    ) {
    }
}

export class ClientInfo {
    constructor(
        public fullName: string,
        public phone_number: string,
        public id: number | null = null,
    ) {
    }

    public getIdentifier(): string {
        if (this.id)
            return this.id.toString();

        return this.fullName;
    }
}

export interface ClientInfoForm {
    fullName: FormControl<string>;
    phone_number: FormControl<string>;
    id: FormControl<number | null>;
}

export interface ClientForm {
    second_name: string;
    first_name: string;
    phone: string;
    smsInvite: boolean;
}

export interface ClientInfoDTO {
    client: {
        first_name: string;
        last_name: string;
    };
    phone: {
        number: string;
    };
}

export interface ClientSearchDTO {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    nickname: string | null;
    phone_number: number | string,
}

export class ClientSearch {
    constructor(
        public id: number,
        public username: string,
        public firstName: string,
        public lastName: string,
        public nickname: string | null = null,
        public phone_number: number | string,
    ) {
    }

    public getFullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}

export interface TaskLog {
    id: number,
    cr_time: Date,
    up_time: Date,
    task_id: number,
    cr_user_id: number,
    message: string | null,
    log_data: string
}

export type TaskStatusLabelKey =
    | 'paymentStatus.paid'
    | 'paymentStatus.notPaid'
    | 'paymentStatus.refund'
    | 'paymentStatus.inProgress'
    | 'taskStatus.planned'
    | 'taskStatus.deleted'
    | 'taskStatus.cancelled'
    | 'taskStatus.completed';

export const paymentStatusMap: Record<TaskPaymentStatusEnum, { /** @deprecated */ label: string; labelKey: TaskStatusLabelKey; class: string }> = {
    [TaskPaymentStatusEnum.Paid]: {label: LABELS_UK['paymentStatus.paid'], labelKey: 'paymentStatus.paid', class: 'status__paid'},
    [TaskPaymentStatusEnum.NotPaid]: {label: LABELS_UK['paymentStatus.notPaid'], labelKey: 'paymentStatus.notPaid', class: 'status__notpaid'},
    [TaskPaymentStatusEnum.Refund]: {label: LABELS_UK['paymentStatus.refund'], labelKey: 'paymentStatus.refund', class: 'status__refund'},
    [TaskPaymentStatusEnum.InProgress]: {label: LABELS_UK['paymentStatus.inProgress'], labelKey: 'paymentStatus.inProgress', class: 'status__inprogress'},
};

export const taskStatusMap: Record<TaskStatusEnum, { /** @deprecated */ label: string; labelKey: TaskStatusLabelKey; class: string }> = {
    [TaskStatusEnum.Active]: {label: LABELS_UK['taskStatus.planned'], labelKey: 'taskStatus.planned', class: 'status__assigned'},
    [TaskStatusEnum.Inactive]: {label: LABELS_UK['taskStatus.deleted'], labelKey: 'taskStatus.deleted', class: 'status__inactive'},
    [TaskStatusEnum.New]: {label: LABELS_UK['taskStatus.planned'], labelKey: 'taskStatus.planned', class: 'status__assigned'},
    [TaskStatusEnum.Assigned]: {label: LABELS_UK['taskStatus.planned'], labelKey: 'taskStatus.planned', class: 'status__assigned'},
    [TaskStatusEnum.Cancelled]: {label: LABELS_UK['taskStatus.cancelled'], labelKey: 'taskStatus.cancelled', class: 'status__cancelled'},
    [TaskStatusEnum.Completed]: {label: LABELS_UK['taskStatus.completed'], labelKey: 'taskStatus.completed', class: 'status__completed'},
    [TaskStatusEnum.Deleted]: {label: LABELS_UK['taskStatus.deleted'], labelKey: 'taskStatus.deleted', class: 'status__inactive'},
};
