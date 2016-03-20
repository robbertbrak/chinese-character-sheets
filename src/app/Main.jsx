import React, { Component } from 'react';
import TextArea from 'react-textarea-autosize';

let PDFDocument = require('fzcs-pdfkit-fontkit');
let BlobStream = require('blob-stream');

class Main extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.setCharacters = this.setCharacters.bind(this);
    this.setSquaresPerLine = this.setSquaresPerLine.bind(this);
    this.setNumGray = this.setNumGray.bind(this);
    this.generatePdf = this.generatePdf.bind(this);
    this.generatePage = this.generatePage.bind(this);

    this.state = {
      characters: '怎麼樣',
      charactersOnCurrentPage: '',
      squaresPerLine: 9,
      numGray: 3,
      loading: true
    }
  }

  componentDidMount() {
    let request = new XMLHttpRequest();
    request.open("GET", "fonts/UKaiCN.ttf", true);
    request.responseType = "arraybuffer";
    request.send(null);
    request.onload = () => {
      this.setState({fontBuffer: request.response, loading: false});
    }
  }

  setCharacters(e) {
    this.setState({characters: e.target.value});
  }

  setSquaresPerLine(e) {
    this.setState({
      squaresPerLine: e.target.value,
      numGray: Math.min(this.state.numGray, e.target.value - 1)
    })
  }

  setNumGray(e) {
    this.setState({
      numGray: e.target.value
    })
  }

  generatePdf(e) {
    e.preventDefault();
    let size = Math.round(500 / this.state.squaresPerLine);
    if (size % 2 === 1) size += 1;
    let h = size / 2;

    let charsPerPage = Math.floor(297 * this.state.squaresPerLine / 210);
    let pages = [];
    let chars = this.state.characters;
    while (chars.length > 0) {
      pages.push(chars.substr(0, charsPerPage));
      chars = chars.substr(charsPerPage);
    }

    let doc = new PDFDocument({margin: 1});
    doc.registerFont('UKaiCN', this.state.fontBuffer);

    for (let p = 0; p < pages.length; p++) {
      if (p > 0) doc.addPage();
      doc.font('Helvetica').fontSize(8).text('(c) Robbert Brak, robbertbrak.com', 440, 760);
      doc.font('UKaiCN').fontSize(size - Math.round(size / 8));
      for (let i = 0; i < this.state.squaresPerLine; i++) {
        for (let j = 0; j < pages[p].length; j++) {
          let x = 40 + i * size;
          let y = 40 + j * size;
          doc.rect(x, y, size, size);
          doc.lineWidth(1).undash().strokeColor('#000', '1').stroke();
          doc.lineWidth(0.5).dash(3, 6).strokeColor('#000', '0.2')
              .moveTo(x, y + h).lineTo(x + size, y + h)
              .moveTo(x + h, y).lineTo(x + h, y + size)
              .stroke();

          doc.fillColor('#000', '1');
          if (i > 0 && i <= this.state.numGray) doc.opacity('0.3');
          if (i <= this.state.numGray) doc.text(pages[p].charAt(j), x + Math.round(size / 20), y);
        }
      }
    }

    let stream = doc.pipe(BlobStream());
    doc.end();
    stream.on('finish', () => {
      let url = stream.toBlobURL('application/pdf');
      document.getElementById("pdf-preview").src = url;
    });
  }

  generatePage(pdf, pages) {
    let grid = document.getElementById('print-grid');
    this.setState({charactersOnCurrentPage: pages[0]},
        () => {
          grid.style.display = 'block';
          pdf.setFontSize(12);
          pdf.text(400, 830, '(c) Robbert Brak, robbertbrak.com');
          pdf.addHTML(grid, 0, 40, () => {
            if (pages.length > 1) {
              pdf.addPage();
              this.generatePage(pdf, pages.slice(1))
            } else {
              pdf.output('save', 'grid.pdf');
              this.setState({generating: false});
            }
          })
          grid.style.display = 'none';
        });
  }

  render() {
    return (
          <div>
            <nav className="navbar navbar-default">
              <div className="container">
                <div className="navbar-header">
                  <div className="navbar-brand">Chinese Character Practice Sheets</div>
                </div>
              </div>
            </nav>
            <div className="container-fluid">
              <div className="row">
                <div className="col-xs-4">
                  <form>
                    <div className="form-group">
                      <label htmlFor="input-characters">Type characters here</label>
                      <TextArea className="form-control" id="input-characters" type="text" minRows={2}
                             value={this.state.characters} onChange={this.setCharacters} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-squaresperline">{'Number of squares per line: ' + this.state.squaresPerLine}</label>
                      <input type="range" min={4} max={10} step={1}
                             value={this.state.squaresPerLine} onChange={this.setSquaresPerLine}>
                      </input>
                    </div>
                    <div className="form-group">
                      <label htmlFor="input-numgray">{'Number of gray characters: ' + this.state.numGray}</label>
                      <input type="range" min={0} max={this.state.squaresPerLine - 1} step={1}
                             value={this.state.numGray} onChange={this.setNumGray}>
                      </input>
                    </div>
                    <div className="form-group">
                      {this.state.loading ? <div>Please wait while loading font...</div> : false}
                      <button className="btn btn-primary btn-lg" disabled={this.state.loading} onClick={this.generatePdf}>
                        Generate PDF
                      </button>
                    </div>
                  </form>
                </div>
                <div className="col-xs-8">
                  <iframe id="pdf-preview" width="595" height="800" src=""></iframe>
                </div>
              </div>
            </div>
          </div>
    );
  }
}

export default Main;
