export class TimeSlot {
    constructor(
        public id: number,
        public cr_time: string,
        public period: string,
        public task_type_id: number | null,
    ) {
    }
}
