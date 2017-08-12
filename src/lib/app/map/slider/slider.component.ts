import {
  AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';

@Component({
  selector: 'cp-slider',
  template: `
    <svg #slider width="700" height="50"></svg>
  `,
  styleUrls: ['./slider.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class SliderComponent implements AfterViewInit {

  @ViewChild('slider') slider: ElementRef;
  @Output('onChange') onChange: EventEmitter<any> = new EventEmitter();

  margin = {right: 50, left: 50};
  width = 700 - this.margin.left - this.margin.right;
  height = 50;
  step = 5;

  x = d3.scaleTime()
    .domain([new Date(2000, 0, 1), new Date(2000, 0, 11)])
    .range([0, this.width])
    .clamp(true);

  constructor() { }

  onHandleDrag(handle, val: any) {
    handle.attr('cx', this.x(val));
    // console.log('onHandleDrag', val);
    this.onChange.emit(val)
  }

  ngAfterViewInit() {
    const { margin, height } = this;
    const svg = d3.select(this.slider.nativeElement);

    const slider = svg.append('g')
      .attr('class', 'slider')
      .attr('transform', 'translate(' + margin.left + ',' + height / 2 + ')');

    const track = slider.append('line')
      .attr('class', 'track')
      .attr('x1', this.x.range()[0])
      .attr('x2', this.x.range()[1]);

    const trackInset = slider.append('line')
      .attr('class', 'track-inset')
      .attr('x1', this.x.range()[0])
      .attr('x2', this.x.range()[1]);

    const trackOverlay = slider.append('line')
      .attr('class', 'track-overlay')
      .attr('x1', this.x.range()[0])
      .attr('x2', this.x.range()[1]);

    const handle = slider.insert('circle', '.track-overlay')
      .attr('class', 'handle')
      .attr('r', 9);

    const drag = d3.drag()
      .on('start.interrupt', () => { slider.interrupt(); })
      .on('start drag', (t) => {
        this.onHandleDrag(handle, this.x.invert(d3.event.x))
      });
      // .on('end drag', () => {console.log('drag end!!!')});

    track.call(drag);
    trackInset.call(drag);
    trackOverlay.call(drag);

    slider.insert('g', '.track-overlay')
      .attr('class', 'ticks')
      .attr('transform', 'translate(0,' + 18 + ')')
      .selectAll('text')
      .data(this.x.ticks(5))
      .enter().append('text')
      .attr('x', this.x)
      .attr('text-anchor', 'middle')
      .text(d => (moment(d).format('YYYY-MM-DD')));



    slider.transition() // Gratuitous intro!
      .duration(750)
      .tween('hue', () => {
        const i = d3.interpolate(0, 70);
        return (t) => { console.log(t) };
      });



  }
}
