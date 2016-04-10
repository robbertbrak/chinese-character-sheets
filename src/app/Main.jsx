import React, { Component } from 'react';
import TextArea from 'react-textarea-autosize';
import readQueryString from './querystring'
import predefinedLists from './predefined_lists'
import LoadingIndicator from './LoadingIndicator'

let PDFDocument = require('fzcs-pdfkit-fontkit');
let BlobStream = require('blob-stream');

function debounce(func, wait) {
  let timeout;
  return function() {
    let context = this, args = arguments;
    let later = function() {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const papersizes = {
  'a4': [595, 842],
  'letter': [612, 792]
}

class Main extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.setCharacters = this.setCharacters.bind(this);
    this.selectPredefinedList = this.selectPredefinedList.bind(this);
    this.selectPapersize = this.selectPapersize.bind(this);
    this.setSquaresPerLine = this.setSquaresPerLine.bind(this);
    this.setNumGray = this.setNumGray.bind(this);
    this.generatePdf = this.generatePdf.bind(this);

    let queryString = readQueryString();
    let squares = Math.min(queryString.squares || 9, 10);
    let numGray = Math.min(queryString.gray || 3, squares - 1);

    this.state = {
      characters: queryString.characters || '怎麼樣',
      squaresPerLine: squares,
      numGray: numGray,
      loadingFont: false,
      percentComplete: 0,
      generating: false,
      papersize: 'a4'
    }
  }


  componentDidMount() {
    this.setState({loadingFont: true});
    let request = new XMLHttpRequest();
    request.open('GET', 'fonts/UKaiCN.ttf', true);
    request.responseType = 'arraybuffer';
    request.addEventListener('progress', (evt) => {
      if (evt.lengthComputable) {
        let percentComplete = Math.round(100 * evt.loaded / evt.total);
        this.setState({percentComplete: percentComplete});
      }
    }, false);
    request.send(null);
    request.onload = () => {
      this.setState({fontBuffer: request.response, loadingFont: false});
      this.generatePdf()
    }
  }

  setCharacters(e) {
    this.setState({ characters: e.target.value });
  }

  selectPredefinedList(e) {
    let indices = e.target.value.split(',');
    if (indices.length === 2) {
      this.setState({
        characters: predefinedLists[indices[0]]['lists'][indices[1]]['value'],
        generating: true
      }, () => setTimeout(this.generatePdf, 0));
    }
  }

  selectPapersize(e) {
    this.setState({
      papersize: e.target.value,
      generating: true
    }, () => setTimeout(this.generatePdf, 0));
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

  generatePdf() {
    this.setState({generating: true}, () => {
      let size = Math.round(510 / this.state.squaresPerLine);
      if (size % 2 === 1) size += 1;
      let h = size / 2;

      let papersize = papersizes[this.state.papersize];

      let charsPerPage = Math.floor(papersize[1] * this.state.squaresPerLine / papersize[0]);
      let pages = [];
      let chars = this.state.characters.replace(/\s/g,'');
      while (chars.length > 0) {
        pages.push(chars.substr(0, charsPerPage));
        chars = chars.substr(charsPerPage);
      }

      let doc = new PDFDocument({margin: 1, size: this.state.papersize});
      doc.registerFont('UKaiCN', this.state.fontBuffer);

      for (let p = 0; p < pages.length; p++) {
        if (p > 0) doc.addPage();
        doc.font('Helvetica').fontSize(8)
            .text('(c) Robbert Brak, robbertbrak.com', papersize[0] - 160, papersize[1] - 32);

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
        document.getElementById('pdf-preview').src = url;
        this.setState({generating: false});
      });
    });
  }

  render() {
    return (
          <div>
            <nav className='navbar navbar-default'>
              <div className='container'>
                <div className='navbar-header'>
                  <div className='navbar-brand'>Chinese Character Practice Sheets</div>
                </div>
              </div>
            </nav>
            <div className='container'>
              <div className='row'>
                <div className='col-sm-4'>
                  <form>
                    <div className='form-group'>
                      <label htmlFor='input-characters'>Type characters here</label>
                      <TextArea className='form-control' id='input-characters' type='text' minRows={2} maxRows={20}
                             value={this.state.characters} onChange={this.setCharacters} />
                    </div>
                    <div className='form-group'>
                      <select className='form-control' id='predefined-lists' onChange={this.selectPredefinedList}>
                        <option key={-1} value={-1}>- Select predefined list -</option>
                        {predefinedLists.map((group, i) =>
                            (<optgroup key={'og' + i} label={group.header}>
                              {group.lists.map((list, index) =>
                                  (<option key={i + ',' + index} value={i + ',' + index}>{list.name}</option>)
                              )
                              }</optgroup>))}
                      </select>
                    </div>
                    <div className='form-group'>
                      <label htmlFor='input-characters'>Paper size</label>
                      <select className='form-control' id='papersize'
                              value={this.state.papersize} onChange={this.selectPapersize}>
                        <option value='a4'>A4</option>
                        <option value='letter'>US Letter</option>
                      </select>
                    </div>
                    <div className='form-group'>
                      <label htmlFor='input-squaresperline'>{'Number of squares per line: ' + this.state.squaresPerLine}</label>
                      <input type='range' min={4} max={10} step={1}
                             value={this.state.squaresPerLine} onChange={this.setSquaresPerLine}>
                      </input>
                    </div>
                    <div className='form-group'>
                      <label htmlFor='input-numgray'>{'Number of gray characters: ' + this.state.numGray}</label>
                      <input type='range' min={0} max={this.state.squaresPerLine - 1} step={1}
                             value={this.state.numGray} onChange={this.setNumGray}>
                      </input>
                    </div>
                  </form>
                  <div className='row higher'>
                    <div className='col-md-12'>
                      <button className='btn btn-primary btn-lg pull-right'
                              disabled={this.state.loadingFont || this.state.generating} onClick={this.generatePdf}>
                        Generate PDF
                      </button>
                      {this.state.loadingFont
                          ? (<LoadingIndicator text={'Please wait while font is loading... ' + this.state.percentComplete + '%'} />)
                          : false}
                      {this.state.generating ? (<LoadingIndicator text={'Generating PDF... '} />) : false}
                    </div>
                  </div>
                </div>
                <div className='col-sm-8'>
                  <iframe id='pdf-preview' width='500' height='800' frameBorder='no' src=''></iframe>
                </div>
              </div>
            </div>
          </div>
    );
  }
}

export default Main;
