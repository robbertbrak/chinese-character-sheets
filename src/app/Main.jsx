import React from 'react';
import getMuiTheme from 'material-ui/lib/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/lib/MuiThemeProvider';
import TextField from 'material-ui/lib/text-field';
import AppBar from 'material-ui/lib/app-bar';
import RaisedButton from 'material-ui/lib/raised-button';
import Slider from 'material-ui/lib/slider';
import MyTheme from './theme/theme';
import CharacterGrid from './CharacterGrid';

const styles = {
  container: {
    textAlign: 'center',
    paddingTop: 100,
    width: 800,
    margin: 'auto'
  },
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
    this.generatePdf = this.generatePdf.bind(this);
    this.generatePage = this.generatePage.bind(this);

    this.state = {
      characters: '怎麼樣',
      charactersOnCurrentPage: '',
      squaresPerLine: 9
    }
  }

  updateGrid(e) {
    this.setState({characters: e.target.value});
  }

  setSquaresPerLine(e, value) {
    this.setState({squaresPerLine: value})
  }

  generatePdf() {
    this.setState({generating: true});
    let pdf = new jsPDF('p', 'pt', 'a4');

    let charsPerPage = Math.floor(297 * this.state.squaresPerLine / 210);
    let pages = [];
    let chars = this.state.characters;
    while (chars.length > 0) {
      pages.push(chars.substr(0, charsPerPage));
      chars = chars.substr(charsPerPage);
    }

    this.generatePage(pdf, pages);
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
            <div style={styles.container}>
              <TextField floatingLabelText="Type characters here"
                         fullWidth={true}
                         value={this.state.characters}
                         onChange={this.updateGrid}/>
              <br/>
              <Slider description={"Number of squares per line: " + this.state.squaresPerLine}
                      step={1} min={4} max={10} value={this.state.squaresPerLine}
                      required={false}
                      onChange={this.setSquaresPerLine} />
              <RaisedButton label="Generate PDF" primary={true} style={styles.button} disabled={this.state.generating}
              onClick={this.generatePdf} />
              <CharacterGrid characters={this.state.characters} className="normal"
                             squaresPerLine={this.state.squaresPerLine}/>
              <CharacterGrid characters={this.state.charactersOnCurrentPage} id="print-grid" className="print"
                             print={true}
                             squaresPerLine={this.state.squaresPerLine}/>
            </div>
          </div>
        </MuiThemeProvider>
    );
  }
}

export default Main;
