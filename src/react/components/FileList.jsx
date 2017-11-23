import React from 'react';
import PropTypes from 'prop-types';
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed';
import styles from './FileList.less';


export default class FileList extends React.Component {
    componentDidMount() {
        this.ensureVisible();
    }

    componestDidUpdate() {
        this.ensureVisible();
    }   

    ensureVisible() {
        if (this.props.active) {
            scrollIntoViewIfNeeded(this.ulDom,false, { duration: 150 });
        }
    }

    itemClicked(item) {

        if (item.isDirectory) {
            this.props.onDirectorySelected([ ...this.props.listing.path,item.name ] );
        }
        else  {
            this.props.onFileSelected(this.props.listing.path,item.name);
        }
    }

    render() {
        return ( <ul className={styles.fileList} ref={ (ul) => this.ulDom = ul } >
            {this.props.listing.items.map( (item) => {
                let c = item.isDirectory ? styles.directory : styles.file;
                return <li className={c} key={item.id}><a onClick={ () => this.itemClicked(item) } href="#">{item.name}</a></li>;
            })}
        </ul>
        );
    }
}

FileList.propTypes = {
    active: PropTypes.bool.isRequired,                  
    listing: PropTypes.object.isRequired,
    onFileSelected: PropTypes.func.isRequired,
    onDirectorySelected: PropTypes.func.isRequired
};
