// source for code: https://observablehq.com/@d3/multi-line-chart/2

d3.csv("final_stockpile_line.csv", d3.autoType).then((data) => {
  data.forEach((d) => {
    d.Year = +d.Year;

    //for null values in csv
    Object.keys(d).forEach((key) => {
      if (key !== "Year" && isNaN(d[key])) {
        d[key] = null;
      }
    });
  });

  console.log("Parsed Data:", data);

  stockpileData = data;
  updateChart();
});

const width = 928;
const height = 600;
const marginTop = 20;
const marginRight = 200;
const marginBottom = 30;
const marginLeft = 80;

function updateChart() {
  if (stockpileData.length === 0) return;

  // scales
  const x = d3
    .scaleLinear()
    .domain(d3.extent(stockpileData, (d) => d.Year))
    .range([marginLeft, width - marginRight]);

  const y = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(stockpileData, (d) => d3.max(Object.values(d).slice(1))),
    ])
    .range([height - marginBottom, marginTop]);

  // colours from flourish, L2R on csv
  const custom_colours = [
    "#FFD700",
    "#9B30FF",
    "#FF69B4",
    "#FF00FF",
    "#00FFFF",
    "#32CD32",
    "#007FFF",
    "#FF7F00",
    "#00CED1",
    "#FF3030",
  ];

  const colour = d3
    .scaleOrdinal()
    .domain(Object.keys(stockpileData[0]).slice(1))
    .range(custom_colours);

  const chartContainer = d3.select("#linechart");
  // chartContainer.selectAll("svg").remove();

  const svg = chartContainer
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr(
      "style",
      "max-width: 100%; height: auto; overflow: visible; font: 10px sans-serif;"
    );

  const chartGroup = svg.append("g");

  // Add the x axis.
  var xAxisGroup = chartGroup
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  // Add the y axis.
  var yAxisGroup = chartGroup
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y))
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "black")
        .attr("text-anchor", "start")
        .text("↑ Number of Nuclear Weapons")
    );

  const countries = Object.keys(stockpileData[0]).slice(1);
  //grouping stockpiles by country
  const dataByCountry = countries.map((country) => {
    return {
      name: country,
      values: stockpileData.map((d) => ({
        Year: d.Year,
        Stockpile: d[country],
      })),
    };
  });

  // Draw the lines.
  const line = d3
    .line()
    .x((d) => x(d.Year))
    .y((d) => y(d.Stockpile));

  const path = chartGroup
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(dataByCountry)
    .join("path")
    .attr("stroke", (d) => (d.name === "World" ? "black" : colour(d.name)))
    .style("mix-blend-mode", "multiply")
    .attr("d", (d) => line(d.values));

  // brush!!!

  // interactive tip
  const dot = svg.append("g").attr("display", "none");

  dot.append("circle").attr("r", 2.5);

  dot.append("text").attr("text-anchor", "middle").attr("y", -8);

  svg
    .on("pointerenter", pointerentered)
    .on("pointermove", pointermoved)
    .on("pointerleave", pointerleft)
    .on("touchstart", (event) => event.preventDefault());

  function pointermoved(event) {
    const [xm, ym] = d3.pointer(event);
    const closest = dataByCountry
      .flatMap((d) => d.values.map((v) => ({ ...v, name: d.name })))
      .reduce((a, b) =>
        Math.hypot(x(b.Year) - xm, y(b.Stockpile) - ym) <
        Math.hypot(x(a.Year) - xm, y(a.Stockpile) - ym)
          ? b
          : a
      );

    path
      .style("stroke", (d) => (d.name === closest.name ? null : "#ddd"))
      .filter((d) => d.name === closest.name)
      .raise();
    dot.attr(
      "transform",
      `translate(${x(closest.Year)},${y(closest.Stockpile)})`
    );
    // dot.select("text").text(closest.name);
    dot
      .select("text")
      .text(`${closest.Year}: ${closest.name}, ${closest.Stockpile} weapons`);
  }

  function pointerentered() {
    path.style("mix-blend-mode", null).style("stroke", "#ddd");
    dot.attr("display", null);
  }

  function pointerleft() {
    path.style("mix-blend-mode", "multiply").style("stroke", null);
    dot.attr("display", "none");
  }

  //highlighted sentences

  // legend
  const legend = svg
    .append("g")
    .attr("transform", `translate(${width - marginRight + 20}, 20)`);

  countries.forEach((country, i) => {
    const legendRow = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow
      .append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", country === "World" ? "black" : colour(country));

    legendRow
      .append("text")
      .attr("x", 15)
      .attr("y", 5)
      .attr("dy", "0.32em")
      .text(country);
  });
}
