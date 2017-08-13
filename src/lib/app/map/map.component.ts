import {
  AfterViewChecked,
  AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { GMap } from 'primeng/components/gmap/gmap';
import * as d3 from 'd3';
import * as topojson from 'topojson';
import * as polygonCenter from 'geojson-polygon-center'
import {SliderComponent} from './slider/slider.component';
import { latLng, LatLngBounds, geoJSON } from 'leaflet';
import {Event, GeoJSONDirective, MapComponent as LeafMapComponent, OSM_TILE_LAYER_URL} from '@yaga/leaflet-ng2';

declare let google: any;

@Component({
  selector: 'cp-map',
  template: `
    <cp-slider></cp-slider>
    <cp-map-control></cp-map-control>
    <div id="tooltip" class="hidden">
      <div><strong>Borough:</strong> <span id="borough"></span></div>
      <div><strong>District:</strong> <span id="district"></span></div>
    </div>
    <yaga-map
      [(zoom)]="getDuplexPropertyByName('zoom').value"
      [(lat)]="getDuplexPropertyByName('lat').value"
      [(lng)]="getDuplexPropertyByName('lng').value"
      [(minZoom)]="getDuplexPropertyByName('minZoom').value"
      [(maxZoom)]="getDuplexPropertyByName('maxZoom').value"
      [(maxBounds)]="getDuplexPropertyByName('maxBounds').value"
      (baselayerchange)="handleEvent('baselayerchange', $event);"
      (move)="handleEvent('move', $event);"
      (click)="handleEvent('click', $event);"
      (dblclick)="handleEvent('dblclick', $event);"
      (mousedown)="handleEvent('mousedown', $event);"
      (mouseup)="handleEvent('mouseup', $event);"
      (mouseover)="handleEvent('mouseover', $event);"
      (mouseout)="handleEvent('mouseout', $event);"
      (mousemove)="handleEvent('mousemove', $event);"
      (contextmenu)="handleEvent('contextmenu', $event);"
      (keypress)="handleEvent('keypress', $event);"
      (preclick)="handleEvent('preclick', $event);"
      [scrollWheelZoomEnabled]="getInputPropertyByName('scrollWheelZoomEnabled').value"
      [touchZoomEnabled]="getInputPropertyByName('touchZoomEnabled').value"
      [tapEnabled]="getInputPropertyByName('tapEnabled').value">
      <yaga-tile-layer [url]="'http://a.tile.openstreetmap.org/{z}/{x}/{y}.png'"></yaga-tile-layer>
      <yaga-tile-layer yaga-geojson></yaga-tile-layer>
    </yaga-map>
    <!--<svg #map width="0" height="0"></svg>
    <p-gmap #gmap [options]="options" [overlays]="overlays" [style]="{'width':'100%','height':'700px'}" ></p-gmap>-->
  `,
  styleUrls: ['./map.component.less'],
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, AfterViewChecked, OnDestroy {

  @ViewChild('map') map: ElementRef;
  @ViewChild('gmap') gmap: GMap;
  @ViewChild(SliderComponent) slider: SliderComponent;
  // @ViewChild(GeoJSONDirective) geoJSON: GeoJSONDirective<any>;

  layer: GeoJSONDirective<any>;
  @ViewChild(LeafMapComponent) private mapComponent: LeafMapComponent;

  properties = {
    duplex: [
      {name: 'zoom', value: 12, type: 'number' },
      {name: 'lat', value: 40.70, type: 'number' },
      {name: 'lng', value: -73.94, type: 'number' },
      {name: 'minZoom', value: 5, type: 'number' },
      {name: 'maxZoom', value: 15, type: 'number'},
      {
        name: 'maxBounds',
        type: 'latlngBounds',
        value: new LatLngBounds(latLng(-90, -180), latLng(90, 180)),
      },
    ],
    input: [
      {name: 'scrollWheelZoomEnabled', value: true, type: 'checkbox' },
      {name: 'touchZoomEnabled', value: true, type: 'checkbox' },
      {name: 'tapEnabled', value: true, type: 'checkbox' },
    ],
    output: [
      {name: 'baselayerchange', value: '', type: 'event' },
      {name: 'move', value: '', type: 'event' },
      {name: 'click', value: '', type: 'event' },
      {name: 'dblclick', value: '', type: 'event' },
      {name: 'mousedown', value: '', type: 'event' },
      {name: 'mouseup', value: '', type: 'event' },
      {name: 'mouseover', value: '', type: 'event' },
      {name: 'mouseout', value: '', type: 'event' },
      {name: 'mousemove', value: '', type: 'event' },
      {name: 'contextmenu', value: '', type: 'event' },
      {name: 'keypress', value: '', type: 'event' },
      {name: 'preclick', value: '', type: 'event' },
    ],
  };
  public additional: any = {};

  public tileLayerUrl: string = OSM_TILE_LAYER_URL;

  // google map
  options: any;
  bounds: any;
  overlays: any[];

  // d3
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

  initialized = false;

  constructor(
    public el: ElementRef,
    public renderer: Renderer2
  ) {
    (window as any).app = this;
    this.overlays = [];
    this.bounds = new google.maps.LatLngBounds();
    // leaflet
    this.options = {
      layers: [
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
          maxZoom: 18,
          id: 'mapbox.streets',
          accessToken: 'pk.eyJ1IjoibWlsb2Nvc21vcG9saXRhbiIsImEiOiJjajFzNm5kMmcwMGM5MnFvNmIwNjVuNXloIn0.-LZhuP3-yes-BZbdzF8lXg'
        })
      ],
      zoom: 5,
      center: L.latLng({lng: -73.94, lat: 40.70})
    };

    this.style = this.style.bind(this);
    // google
    // this.options = {
    //   center: {lng: -73.94, lat: 40.70},
    //   zoom: 12,
    //   mapTypeId: google.maps.MapTypeId.ROADMAP,
    //   mapTypeControl: false,
    //   mapTypeControlOptions: {
    //     mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN]
    //   }
    // };
    this.projection = d3.geoMercator()
      .center(this.center) // sets map center to Syria's center
      .translate([this.width / 2, this.height / 2])
      .scale(50000);

    this.initGmap = this.initGmap.bind(this);
  }

  resize() {
    if (this.width !== this.el.nativeElement.clientWidth) {
      this.width = this.el.nativeElement.clientWidth;
      this.height = this.el.nativeElement.clientWidth * this.mapRatio;

      // DEFAULT VIEW
      // const svg = d3.select(this.map.nativeElement);
      // svg.attr('width', this.width).attr('height', this.height)
      // console.log(this.width, this.height)
    }
  }

  reload() {
    // const svg = d3.select(this.map.nativeElement);
    // svg.attr('width', this.width).attr('height', this.height)
  }

  getColor(d) {
    console.log('getColor', d)
    return d > 1000 ? '#800026' :
      d > 500  ? '#BD0026' :
        d > 200  ? '#E31A1C' :
          d > 100  ? '#FC4E2A' :
            d > 50   ? '#FD8D3C' :
              d > 20   ? '#FEB24C' :
                d > 10   ? '#FED976' :
                  '#FFEDA0';
  }

  style(feature) {
    const min = Math.ceil(5);
    const max = Math.floor(80);
    const random =  Math.floor(Math.random() * (max - min)) + min;

    return {
      fillColor: this.getColor(feature.properties.boroughCode * random),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }


  initLeaflet() {


    d3.json('assets/community_districts.geojson', (error, ny: any) => {
      this.layer = new GeoJSONDirective(this.mapComponent);
      this.layer.addData(ny);
      this.layer.setStyle(this.style);
      console.log('initLeaflet', this.mapComponent, this.layer, ny)
    });
  }

  initGmap() {
    console.log(this, this.gmap.map.data)
    const stateLayer = this.gmap.map.data;

    function getColor(coli) {

      return coli >= 121 ? '#89a844' :
        coli > 110 ? '#acd033' :
          coli > 102.5 ? '#cbd97c' :
            coli > 100 ? '#c2c083' :
              '#d1ccad';
    }

    stateLayer.loadGeoJson('assets/community_districts.geojson');


    stateLayer.setStyle(function(feature) {
      return {
        fillColor: getColor(feature.getProperty('COLI')), // call function to get color for state based on the COLI (Cost of Living Index)
        fillOpacity: 0.8,
        strokeColor: '#b3b3b3',
        strokeWeight: 1,
        strokeDasharray: [10, 10],
        zIndex: 1
      };
    });
    stateLayer.setMap(this.gmap.map);
  }

  initMap() {
    const { width, height } = this;

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

      if (error) { return console.error(error); }

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

    this.initialized = true;
  }

  public getOutputPropertyByName(name: string) {
    for (let i: number = 0; i < this.properties.output.length; i += 1) {
      if (this.properties.output[i].name === name) {
        return this.properties.output[i];
      }
    }
  }
  public getInputPropertyByName(name: string) {
    for (let i: number = 0; i < this.properties.input.length; i += 1) {
      if (this.properties.input[i].name === name) {
        return this.properties.input[i];
      }
    }
  }
  public getDuplexPropertyByName(name: string) {
    for (let i: number = 0; i < this.properties.duplex.length; i += 1) {
      if (this.properties.duplex[i].name === name) {
        return this.properties.duplex[i];
      }
    }
  }

  public handleEvent(name: string, event: Event): void {
    const target: any = this.getOutputPropertyByName(name);
    target.value = 'Event fired now...';
    setTimeout(() => {
      target.value = '';
    }, 500);
  };

  ngAfterViewInit() {
    (window as any).map = this.mapComponent;
    ((this.mapComponent as any)._container as HTMLElement).style.height = this.height+'px';
    console.log('this.mapComponent', this.mapComponent, this.layer)
    // this.mapComponent._container.style.height = '300px';
    this.mapComponent.invalidateSize();


    // console.log(this.svg, this.map);
    this.sliderValue$ = this.slider.onChange.subscribe(console.log)
    // DEFAULT VIEW
    // this.initMap()


    // this.initGmap();
    this.initLeaflet();
  }


  ngAfterViewChecked() {
    this.resize();
  }

  ngOnDestroy() {
    this.sliderValue$.unsubscribe();
  }

}
