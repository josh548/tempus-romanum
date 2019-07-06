import * as d3 from "d3";
import moment from "moment";

const width = window.innerWidth;
const height = window.innerHeight;
const size = Math.min(width, height);

const svg = d3.select("body")
    .append("svg")
    .attr("width", size)
    .attr("height", size)
    .append("g")
    .attr("transform", `translate(${size / 2}, ${size / 2})`);

const SUNRISE_TIME = "6:07 am";
const SUNSET_TIME = "8:10 pm";

const sunriseMoment = moment(SUNRISE_TIME, ["h:m a"]);
const sunsetMoment = moment(SUNSET_TIME, ["h:m a"]);

const sunriseToSunset = sunsetMoment.diff(sunriseMoment);
const sunsetToSunrise = moment.duration(1, "day").subtract(sunriseToSunset, "milliseconds").asMilliseconds();

const dayHour = moment.duration(sunriseToSunset / 12);
const nightHour = moment.duration(sunsetToSunrise / 12);

const MILLISECONDS_IN_A_DAY = moment.duration(1, "day").asMilliseconds();

function timeToPercent(time: moment.Moment): number {
    return (1 - (moment().endOf("day").valueOf() - time.valueOf()) / MILLISECONDS_IN_A_DAY);
}

const hourLabelRadius = size * 0.25;
const hourArcInnerRadius = size * 0.30;
const hourArcOuterRadius = size * 0.40;
const vigilArcInnerRadius = size * 0.405;
const vigilArcOuterRadius = size * 0.455;

const hourLabels = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const hourData = [];

for (let i = 0; i < 12; i++) {
    const hourStartTime = sunriseMoment.clone().add(dayHour.asMilliseconds() * i);
    const hourEndTime = hourStartTime.clone().add(dayHour.asMilliseconds());
    const hourStartTimePercent = timeToPercent(hourStartTime);
    const hourEndTimePercent = timeToPercent(hourEndTime);
    const hourStartTimeRadians = Math.PI * 2 * hourStartTimePercent;
    const hourEndTimeRadians = Math.PI * 2 * hourEndTimePercent;
    hourData.push({
        isDaytime: true,
        startAngle: hourStartTimeRadians,
        endAngle: hourEndTimeRadians,
        label: hourLabels[i],
    });
}

for (let i = 0; i < 12; i++) {
    const hourStartTime = sunsetMoment.clone().add(nightHour.asMilliseconds() * i);
    const hourEndTime = hourStartTime.clone().add(nightHour.asMilliseconds());
    const hourStartTimePercent = timeToPercent(hourStartTime);
    const hourEndTimePercent = timeToPercent(hourEndTime);
    const hourStartTimeRadians = Math.PI * 2 * hourStartTimePercent;
    const hourEndTimeRadians = Math.PI * 2 * hourEndTimePercent;
    hourData.push({
        isDaytime: false,
        startAngle: hourStartTimeRadians,
        endAngle: hourEndTimeRadians,
        label: hourLabels[i],
    });
}

const hourArc = d3.arc()
    .innerRadius(hourArcInnerRadius)
    .outerRadius(hourArcOuterRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle)
    .padAngle(0.01);

const vigilArc = d3.arc()
    .innerRadius(vigilArcInnerRadius)
    .outerRadius(vigilArcOuterRadius)
    .startAngle((d) => d.startAngle)
    .endAngle((d) => d.endAngle)
    .padAngle(0.01);

svg.selectAll(".hour-arc")
    .data(hourData)
    .enter()
    .append("path")
    .attr("class", (d) => d.isDaytime ? "hour-day" : "hour-night")
    .attr("id", (d, i) => `hour-arc${i}`)
    .attr("d", hourArc as any)
    .each(function(d, i) {
        // Captures everything up to the first L
        const firstArcSection = /(^.+?)L/;

        // Extract the arc statement
        let newArc = firstArcSection.exec(d3.select(this).attr("d"))![1];
        newArc = newArc.replace(/,/g, " ");

        // Flip the start and end positions for daytime hours so that the text
        // appear rightside up
        if (d.isDaytime) {
            // Capture everything between the capital M and first capital A
            const startLocator = /M(.*?)A/;
            // Capture everything between the capital A and 0 0 1
            const middleLocator = /A(.*?)0 0 1/;
            // Capture everything between the 0 0 1 and the end of the string
            const endLocator = /0 0 1 (.*?)$/;
            // Flip the direction of the arc by switching the start and end
            // point and using a 0 (instead of 1) sweep flag
            const newStart = endLocator.exec(newArc)![1];
            const newEnd = startLocator.exec(newArc)![1];
            const middleSec = middleLocator.exec(newArc)![1];

            // Build up the new arc notation and set the sweep flag to 0
            newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
        }

        // Create a new invisible arc that the text can flow along
        svg.append("path")
            .attr("class", "hidden-hour-arc")
            .attr("id", `hidden-hour-arc${i}`)
            .attr("d", newArc)
            .style("fill", "none");
    });

svg.selectAll(".hour-label")
    .data(hourData)
    .enter().append("text")
    .attr("class", "hour-label")
    // Move the labels below the arcs for slices with an end angle > than 90 degrees
    .attr("dy", (d) => {
        if (d.isDaytime) {
            return (-(((hourArcOuterRadius - hourArcInnerRadius) / 2) - 6));
        } else {
            return (((hourArcOuterRadius - hourArcInnerRadius) / 2) + 4);
        }
    })
    .append("textPath")
    .attr("startOffset", "50%")
    .style("text-anchor", "middle")
    .attr("xlink:href", (d, i) => `#hidden-hour-arc${i}`)
    .text((d) => d.label);

const hourScale = d3.scaleLinear()
    .domain([0, 23])
    .range([0, 345]);

svg.selectAll(".hour-tick")
    .data(d3.range(24))
    .enter()
    .append("line")
    .attr("class", "hour-tick")
    .attr("x1", 0)
    .attr("x2", 0)
    .attr("y1", hourArcInnerRadius * 0.90)
    .attr("y2", hourArcInnerRadius * 0.95)
    .attr("transform", (d) => `rotate(${hourScale(d)})`);

svg.selectAll(".hour-tick-label")
    .data(d3.range(24))
    .enter()
    .append("text")
    .attr("class", "hour-tick-label")
    .attr("text-anchor", "middle")
    .attr("x", (d) => {
        return hourLabelRadius * Math.sin(hourScale(d) * (Math.PI / 180));
    })
    .attr("y", (d) => {
        return (-hourLabelRadius) * Math.cos(hourScale(d) * (Math.PI / 180)) + 4;
    })
    .text((d) => d === 0 ? 24 : d);

const vigilData = [];

vigilData.push({
    startAngle: hourData[12].startAngle,
    endAngle: hourData[15].startAngle,
    label: "VIGILIA PRIMA",
});
vigilData.push({
    startAngle: hourData[15].startAngle,
    endAngle: hourData[18].startAngle,
    label: "VIGILIA SECVNDA",
});
vigilData.push({
    startAngle: hourData[18].startAngle,
    endAngle: hourData[21].startAngle,
    label: "VIGILIA TERTIA",
});
vigilData.push({
    startAngle: hourData[21].startAngle,
    endAngle: hourData[0].startAngle + (Math.PI * 2),
    label: "VIGILIA QVARTA",
});

svg.selectAll(".vigil-arc")
    .data(vigilData)
    .enter()
    .append("path")
    .attr("class", "hour-night")
    .attr("id", (d, i) => `vigil-arc${i}`)
    .attr("d", vigilArc as any)
    .each(function(d, i) {
        // Captures everything up to the first L
        const firstArcSection = /(^.+?)L/;

        // Extract the arc statement
        let newArc = firstArcSection.exec(d3.select(this).attr("d"))![1];
        newArc = newArc.replace(/,/g, " ");

        // Create a new invisible arc that the text can flow along
        svg.append("path")
            .attr("class", "hidden-vigil-arc")
            .attr("id", `hidden-vigil-arc${i}`)
            .attr("d", newArc)
            .style("fill", "none");
    });

svg.selectAll(".vigil-label")
    .data(vigilData)
    .enter().append("text")
    .attr("class", "vigil-label")
    .attr("dy", (((vigilArcOuterRadius - vigilArcInnerRadius) / 2) + 4))
    .append("textPath")
    .attr("startOffset", "50%")
    .style("text-anchor", "middle")
    .attr("xlink:href", (d, i) => `#hidden-vigil-arc${i}`)
    .text((d) => d.label);
