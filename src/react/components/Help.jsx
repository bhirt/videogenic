import React from 'react';
import help from '../../../doc/about.md';
import styles from './Help.less';

export default class Help extends React.Component {

    render() {
        return <div className={styles.content} dangerouslySetInnerHTML={ { __html: help} } />;
    }
}
