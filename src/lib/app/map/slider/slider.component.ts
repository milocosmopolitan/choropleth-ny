import {
  AfterViewChecked,
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
export class SliderComponent implements AfterViewInit, AfterViewChecked {

  @ViewChild('slider') slider: ElementRef;
  @Output('onChange') onChange: EventEmitter<any> = new EventEmitter();

  margin = {right: 50, left: 50};
  width = 700;
  height = 50;
  innerWidth = this.width - this.margin.left - this.margin.right;
  step = 5;

  x = d3.scaleTime()
    .domain([new Date(2017, 6, 1), new Date(2017, 6, 11)])
    .range([0, this.innerWidth])
    .clamp(true);

  constructor(public el: ElementRef) { }

  onHandleDrag(handle, val: any) {
    handle.attr('cx', this.x(val));
    // console.log('onHandleDrag', val);
    this.onChange.emit(val)
  }

  resize() {
    if (this.width !== this.el.nativeElement.clientWidth) {
      this.width = this.el.nativeElement.clientWidth;
      this.innerWidth = this.width - this.margin.left - this.margin.right;
      this.x = d3.scaleTime()
        .domain([new Date(2017, 6, 1), new Date(2017, 6, 11)])
        .range([0, this.innerWidth])
        .clamp(true);

      const drag = this.drag();
      // .on('end drag', () => {console.log('drag end!!!')});

      const svg = d3.select(this.slider.nativeElement);
      svg.attr('width', this.width);
      svg.selectAll('line')
        .attr('x1', this.x.range()[0])
        .attr('x2', this.x.range()[1])
        .call(drag);


      svg.selectAll('text')
        .data(this.x.ticks(5))
        .attr('x', this.x);
    }
  }

  drag() {
    const svg = d3.select(this.slider.nativeElement);
    const handle = svg.select('circle.handle');
    const slider = svg.select('g.slider');

    return d3.drag()
      .on('start.interrupt', () => { slider.interrupt(); })
      .on('start drag', (t) => {
        this.onHandleDrag(handle, this.x.invert(d3.event.x))
      });
  }

  initSlider() {
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

    const drag = this.drag();

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

  ngAfterViewInit() {
    this.initSlider()
  }

  ngAfterViewChecked() {
    this.resize();
  }
}
