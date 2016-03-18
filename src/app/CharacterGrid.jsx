import React from 'react';

export default class CharacterGrid extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  color(i) {
    let opacity = 0.4;
    if (i < 1) opacity = 1;
    if (i >= 1 && i <= 3) opacity = (4 - i) / 10;
    if (i > 3) opacity = 0;
    return 'rgba(0, 0, 0, ' + opacity + ')';
  }

  render() {
    let charArray = this.props.characters.split('') || [];
    
    let size = Math.round(600 / this.props.squaresPerLine);

    if (this.props.print) {
      size *= 3;
    }

    let tdStyle = {
      width: size,
      height: size,
      fontSize: size / 20 + 'rem'
    }

    let divStyle = {
      width: this.props.squaresPerLine * size + (this.props.print ? 180 : 0)
    }

    return (
        <div id={this.props.id} className={'character-grid ' + this.props.className} style={divStyle}>
          <table>
            <tbody>
            {charArray.map((char, ix) =>
              <tr key={ix}>
                {Array(this.props.squaresPerLine).fill().map((_, i) =>
                  <td key={i} style={Object.assign({}, tdStyle, {color: this.color(i)})}>{char}</td>
                )}
              </tr>
            )}
            </tbody>
          </table>
        </div>
    );
  }
}

CharacterGrid.propTypes = {
  characters: React.PropTypes.string,
}
