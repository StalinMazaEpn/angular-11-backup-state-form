import { Component, Input } from "@angular/core";

@Component({
  selector: "hello",
  template: `
    <h1>Hello {{ name }}!</h1>
    <br />
  `,
  styles: [
    `
      h1 {
        font-family: Lato;
      }
    `
  ]
})
export class HelloComponent {
  @Input() name: string;

  // constructor() {
  //   const xyz = this.transformList(this.studentsList);
  //   console.log(xyz, "Output");
  // }

  // studentsList = {
  //   Ron: ["HTML5", "CSS3", "JAVASCRIPT"],
  //   Matt: ["HTML5", "JAVA"],
  //   Sam: ["CSS3", "HTML5", "JAVA"],
  //   Kevin: ["JAVASCRIPT", "CSS3"]
  // };

  // outputNeeded = {
  //   HTML5: ["Ron", "Matt", "Sam"],
  //   CSS3: ["Ron", "Sam", "Kevin"],
  //   JAVASCRIPT: ["Ron", "Kevin"],
  //   JAVA: ["Matt", "Sam"]
  // };

  // transformList(list: any): any {
  //   return list;
  // }
}
