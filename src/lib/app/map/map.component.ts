import {
  AfterViewInit, Component, ElementRef, OnDestroy, OnInit, Renderer2, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import {SliderComponent} from './slider/slider.component';

@Component({
  selector: 'cp-map',
  template: `
    <cp-slider></cp-slider>
    <div id="tooltip" class="hidden">
      <div><strong>Borough:</strong> <span id="borough"></span></div>
      <div><strong>District:</strong> <span id="district"></span></div>
    </div>
    <svg #map width="700" height="500"></svg>
  `,
  styleUrls: ['./map.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnDestroy {

  @ViewChild('map') map: ElementRef;
  @ViewChild(SliderComponent) slider: SliderComponent;

  sliderValue$;

  margin = {top: 10, left: 10, bottom: 10, right: 10};
  width: any | number = 1000 - this.margin.left - this.margin.right;
  mapRatio: any | number = 1;
  height = this.width * this.mapRatio;
  mapRatioAdjuster: any | number = 4; // adjust map ratio here without changing map container size.
  center: [number, number] = [-73.94, 40.70];

  projection;
  path;
  features;
  svg;

  constructor(
    public el: ElementRef,
    public renderer: Renderer2
  ) {
    this.projection = d3.geoMercator()
      .center(this.center) // sets map center to Syria's center
      .translate([this.width / 2, this.height / 2])
      .scale(50000);
  }

  ngAfterViewInit() {
    // console.log(this.svg, this.map);
    this.sliderValue$ = this.slider.onChange.subscribe(console.log)

    const { width, height} = this;

    const svg = d3.select(this.map.nativeElement);

    const zoomed = () => {
      const transform = d3.event.transform;
      // console.log('zoomed', transform)
      features.attr('transform', 'translate(' + transform.x + ',' + transform.y + ') scale(' + transform.k + ')');
    };

    const zoom = d3.zoom().on('zoom', zoomed);

    svg.call(zoom); // Call zoom function on map

    // Define path generator
    const path = d3.geoPath(this.projection);

    // Group SVG elements together
    const features = svg.append('g');

    // Load TopoJSON data
    d3.json('assets/community_district.json', (error, ny: any) => {

      if (error) {
        return console.error(error);
      }

      // console.log(ny);
      const subunits = topojson.feature(ny, ny.objects.community_districts);

      // Bind data and create one path per TopoJSON feature
      features.selectAll('path')
        .data(subunits.features)
        .enter()
        .append('path')
        .attr('d', path)

        // Sets colors of fill and stroke for each district. Sets stroke width, too.
        .attr('fill', '#e8d8c3')
        .attr('stroke', '#404040')
        .attr('stroke-width', .3)

        .on('mousemove', (d: any) => {

          console.log('mousemove', d);
          // Update the tooltip position and value
          d3.select('#tooltip')
            .style('top', (d3.event.pageY) + 20 + 'px')
            .style('left', (d3.event.pageX) + 20 + 'px')
            .style('z-index', 100)

            // update governorate name
            .select('#borough')
            .text(d.properties.borough);

          // update district name
          d3.select('#tooltip')
            .select('#district')
            .text(d.properties.neighborhood);

          // Update province and district names in info box
          d3.select('#borough-name')
            .text(d.properties.borough);

          d3.select('#district-name')
            .text(d.properties.neighborhood);

          // Show tooltip
          d3.select('#tooltip').classed('hidden', false);
        })

        // Hide tooltip when user stops hovering over map
        .on('mouseout', () => {
          d3.select('#tooltip').classed('hidden', true);
        });
    });
  }

  ngOnDestroy() {
    this.sliderValue$.unsubscribe();
  }

}
