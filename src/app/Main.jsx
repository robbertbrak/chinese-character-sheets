import React from 'react';
import getMuiTheme from 'material-ui/lib/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/lib/MuiThemeProvider';
import TextField from 'material-ui/lib/text-field';
import AppBar from 'material-ui/lib/app-bar';
import RaisedButton from 'material-ui/lib/raised-button';
import Slider from 'material-ui/lib/slider';
import MyTheme from './theme/theme';
import CharacterGrid from './CharacterGrid';

let PDFDocument = require('fzcs-pdfkit-fontkit');
let BlobStream = require('blob-stream');

const styles = {
  button: {
    margin: 12,
  }
};

const muiTheme = getMuiTheme(MyTheme);

class Main extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.updateGrid = this.updateGrid.bind(this);
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

  updateGrid(e) {
    this.setState({characters: e.target.value});
  }

  setSquaresPerLine(_, value) {
    this.setState({
      squaresPerLine: value,
      numGray: Math.min(this.state.numGray, value)
    })
  }

  setNumGray(_, value) {
    this.setState({numGray: value})
  }

  generatePdf() {
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
        <MuiThemeProvider muiTheme={muiTheme}>
          <div>
            <AppBar title="Chinese Character Practice Sheets"
                    iconClassNameRight="muidocs-icon-navigation-expand-more"
                    iconClassNameLeft="none"
            />
            <div className="container">
              <span className="left">
                <TextField floatingLabelText="Type characters here"
                           fullWidth={true}
                           value={this.state.characters}
                           onChange={this.updateGrid}/>
                <br/>
                <div style={{paddingTop: 20 }}>
                  <Slider description={"Number of squares per line: " + this.state.squaresPerLine}
                          step={1} min={4} max={10} value={this.state.squaresPerLine}
                          required={false}
                          onChange={this.setSquaresPerLine} />
                  <Slider description={"Number of gray characters: " + this.state.numGray}
                          step={1} min={0} max={this.state.squaresPerLine - 1} value={this.state.numGray}
                          required={false}
                          onChange={this.setNumGray} />

                </div>
                {this.state.loading ? <div>Please wait while loading font...</div> : false}
                <RaisedButton label="Generate PDF" primary={true} style={styles.button} disabled={this.state.loading}
                onClick={this.generatePdf} />
                <br/>
              </span>
              <span className="right">
                <iframe id="pdf-preview" width="595" height="800" src=""></iframe>
              </span>
            </div>
          </div>
        </MuiThemeProvider>
    );
  }
}

export default Main;
