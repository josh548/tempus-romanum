import moment from "moment";

import {drawChart} from "./chart";

const SUNRISE_TIME: string = "6:07 am";
const SUNSET_TIME: string = "8:10 pm";
const sunriseMoment: moment.Moment = moment(SUNRISE_TIME, ["h:m a"]);
const sunsetMoment: moment.Moment = moment(SUNSET_TIME, ["h:m a"]);
drawChart(sunriseMoment, sunsetMoment);
