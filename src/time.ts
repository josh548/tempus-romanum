import moment from "moment";

const MILLISECONDS_IN_A_DAY: number = moment.duration(1, "day").asMilliseconds();

const ORDINALS: string[] = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export interface TimeData {
    hours: TimeArcData[];
    vigils: TimeArcData[];
    quarters: TimeArcData[];
}

export interface TimeArcData {
    isDaytime?: boolean;
    startAngle: number;
    endAngle: number;
    label: string;
}

function getPercentOfDay(time: moment.Moment): number {
    return (1 - (moment().endOf("day").valueOf() - time.valueOf()) / MILLISECONDS_IN_A_DAY);
}

export function getTimeData(sunriseMoment: moment.Moment, sunsetMoment: moment.Moment): TimeData {
    const hourData: TimeArcData[] = [];
    const sunriseToSunset: number = sunsetMoment.diff(sunriseMoment);
    const sunsetToSunrise: number = moment.duration(1, "day").subtract(sunriseToSunset, "ms").asMilliseconds();
    const dayHour: moment.Duration = moment.duration(sunriseToSunset / 12);
    const nightHour: moment.Duration = moment.duration(sunsetToSunrise / 12);

    for (let i = 0; i < 12; i++) {
        const hourStartTime: moment.Moment = sunriseMoment.clone().add(dayHour.asMilliseconds() * i);
        const hourEndTime: moment.Moment = hourStartTime.clone().add(dayHour.asMilliseconds());
        const hourStartTimeRadians: number = Math.PI * 2 * getPercentOfDay(hourStartTime);
        const hourEndTimeRadians: number = Math.PI * 2 * getPercentOfDay(hourEndTime);
        hourData.push({
            isDaytime: true,
            startAngle: hourStartTimeRadians,
            endAngle: hourEndTimeRadians,
            label: ORDINALS[i],
        });
    }
    for (let i = 0; i < 12; i++) {
        const hourStartTime: moment.Moment = sunsetMoment.clone().add(nightHour.asMilliseconds() * i);
        const hourEndTime: moment.Moment = hourStartTime.clone().add(nightHour.asMilliseconds());
        const hourStartTimeRadians: number = Math.PI * 2 * getPercentOfDay(hourStartTime);
        const hourEndTimeRadians: number = Math.PI * 2 * getPercentOfDay(hourEndTime);
        hourData.push({
            isDaytime: false,
            startAngle: hourStartTimeRadians,
            endAngle: hourEndTimeRadians,
            label: ORDINALS[i],
        });
    }

    const vigilData: TimeArcData[] = [
        {
            startAngle: hourData[12].startAngle,
            endAngle: hourData[15].startAngle,
            label: "VIGILIA I",
        },
        {
            startAngle: hourData[15].startAngle,
            endAngle: hourData[18].startAngle,
            label: "VIGILIA II",
        },
        {
            startAngle: hourData[18].startAngle,
            endAngle: hourData[21].startAngle,
            label: "VIGILIA III",
        },
        {
            startAngle: hourData[21].startAngle,
            endAngle: hourData[0].startAngle + (Math.PI * 2),
            label: "VIGILIA IV",
        },
    ];

    const quarterData: TimeArcData[] = [
        {
            startAngle: hourData[0].startAngle - (Math.PI / 2),
            endAngle: hourData[0].startAngle + (Math.PI / 2),
            label: "MANE",
        },
        {
            startAngle: hourData[6].startAngle - (Math.PI / 2),
            endAngle: hourData[6].startAngle + (Math.PI / 2),
            label: "DIES",
        },
        {
            isDaytime: true,
            startAngle: hourData[12].startAngle - (Math.PI / 2),
            endAngle: hourData[12].startAngle + (Math.PI / 2),
            label: "VESPER",
        },
        {
            isDaytime: false,
            startAngle: hourData[18].startAngle - (Math.PI / 2),
            endAngle: hourData[18].startAngle + (Math.PI / 2),
            label: "NOX",
        },
    ];

    return {
        hours: hourData,
        vigils: vigilData,
        quarters: quarterData,
    };
}
