/*
entryEditor focuses on changing content, saving it
*/

import * as React from 'react'
import {WSFullEntry} from '../model/wsentry'
import {WSEntryPut, WSEntryPost, RawType} from '../model/wsentry'
import {DataService} from '../common/dataService'
import {RawTypeDropdown} from './rawTypeDropdown'
import {WSRawType} from '../common/rawtypes'

// example:
// declare type MyHandler = (myArgument: string) => void;
// var handler: MyHandler;

export type EditorCloseReqFunc = (fe: WSFullEntry) => void

export interface EditorProps extends React.Props<any>{
		entry: WSFullEntry
		editorCloseReq: EditorCloseReqFunc
}

class EditorState {
	constructor(
		public entry: WSFullEntry = new WSFullEntry()
		//public rawTypeName: string = ""
	) {}
}

/*
	EntryBox provides basic editor to create or update an entry
	and save to the server.
*/
export class EntryEditor extends React.Component<EditorProps, EditorState> {
	// used to manager refs
	// https://medium.com/@basarat/strongly-typed-refs-for-react-typescript-9a07419f807#.27st7hkss
	ctrls: {
		rawFile? :HTMLInputElement
	} = {}

	sendCloseRequest(fe: WSFullEntry) {
		if (this.props.editorCloseReq != null) {
			this.props.editorCloseReq(fe)
		}
	}
	public constructor(props: EditorProps, context) {
		super(props, context)
		let pen: WSFullEntry = props.entry
		// make a copy of entry for easy cancellation
		this.state = new EditorState(new WSFullEntry(
			pen.EntryID, pen.Title, pen.Raw, pen.RawTypeName, pen.Tags, pen.HTML, pen.Updated
		));
	}
	onEditCancelClick() {
		this.sendCloseRequest(this.props.entry);
	}
	onEditSaveClick(close: boolean) {
		let r: Promise<any> = this.onSaveBinary(close)
		r.then((response) => {
			let fe: WSFullEntry = response
			// atob(null) returns "ée", which is not what we want
			if (fe.Raw != null) {
				// base64 to binary array
				fe.Raw = atob(fe.Raw)
			} else {
				// assign to empty string, because of
				// react.js:20541 Warning: `value` prop on `textarea` should not be null.
				// Consider using the empty string to clear the component or `undefined` for uncontrolled components.
				fe.Raw = ""
			}
			// the following line triggers React mesage:
			// 		react.js:20541 Warning: EntryEditor is changing a controlled input of type undefined to be uncontrolled.
			// 		Input elements should not switch from controlled to uncontrolled (or vice versa).
			// The setState call triggers React to think that state is different for controlled element.
			//    this.setState(new EditorState(fe, this.state.rawTypeName))
			// So, we simply rely on original state and merge most important properties here
			let state = (Object as any).assign(new EditorState(), this.state) as EditorState;
			let se = state.entry
			// copy all fields
			se.EntryID = fe.EntryID
			se.HTML = fe.HTML
			se.Raw = fe.Raw
			se.RawTypeName = fe.RawTypeName
			se.Tags = fe.Tags
			se.Title = fe.Title
			se.Updated = fe.Updated
			console.log("editor's setState on success (se, fe)B", se, fe)
			this.setState(state)

			if (close) {
				this.sendCloseRequest(fe);
			}
		})
		.catch((err) => {
			console.log("Failed to save", err)
			if (close) {
				this.sendCloseRequest(this.props.entry);
			}
		})

	}
	// saves binary file
	// example: https://www.raymondcamden.com/2016/05/10/uploading-multiple-files-at-once-with-fetch/
	onSaveBinary(close: boolean) :Promise<any> {
		// save data
		let e: WSFullEntry = this.state.entry

		var fd = new FormData();
		// check if entry is new or update
		if (e.EntryID == 0) {
			// create new entry with PUT
			let wsEntry = new WSEntryPut(e.Title, e.RawTypeName, e.Tags)
			fd.append('entry', JSON.stringify(wsEntry))
		} else {
			// update existing entry with POST
			let wsEntry = new WSEntryPost(e.EntryID, e.Title, e.RawTypeName, e.Tags)
			fd.append('entry', JSON.stringify(wsEntry))
		}
		// check if raw is binary or some other text
		console.log("on save entry", this.state.entry)
		if (this.state.entry.RawTypeName.startsWith(WSRawType.Binary)) {
			let fileBlob = this.ctrls.rawFile.files[0]
			fd.append('rawFile', fileBlob);
		} else {
			fd.append('rawFile', e.Raw)
		}

		// POST in thise case PUTs new entry and updates existing
		let reqInit: RequestInit = DataService.newBareRequestInit("POST")
		reqInit.body = fd
		return DataService.handleFetch("binaryentry/", reqInit)
	}

	onEntryTitleChange(event: React.FormEvent) {
		let state = (Object as any).assign(new EditorState(), this.state) as EditorState;
		state.entry.Title = (event.target as any).value
		this.setState(state)
	}
	onEntryOrigBodyChange(event: React.FormEvent) {
		let state = (Object as any).assign(new EditorState(), this.state) as EditorState;
		state.entry.Raw = (event.target as any).value
		this.setState(state)
	}
	onEntryTagsChange(event: React.FormEvent) {
		let state = (Object as any).assign(new EditorState(), this.state) as EditorState;
		state.entry.Tags = (event.target as any).value
		this.setState(state)
	}
	onRawTypeChange(rawTypeName: string) {
		let state = (Object as any).assign(new EditorState(), this.state) as EditorState;
		state.entry.RawTypeName = rawTypeName
		this.setState(state)
	}
	render() {
		let rawPayload = <p>Data type name is not loaded yet.</p>
		if (this.state.entry.RawTypeName == "") {
			// do nothing
		} else if (this.state.entry.RawTypeName.startsWith(WSRawType.Binary)) {
			let image = <span />
			if (this.state.entry.RawTypeName == WSRawType.BinaryImage && this.state.entry.EntryID > 0) {
				image = <img className='' src={"re/" + this.state.entry.EntryID} />
			}
			// allow user to select new image
			rawPayload = <p>
				<label>File upload:</label>
				<input type="file" ref={(input) => this.ctrls.rawFile = input} />
				{image}
			</p>
		} else {
			rawPayload = <p>
				<label>Raw Text:</label><br />
				<textarea  value={this.state.entry.Raw} onChange={e => this.onEntryOrigBodyChange(e)} className='entryEdit' />
			</p>
		}
		return <div>
			<div className="toolbar entryHeader">
				<h2 className='leftStack'>Editing title:</h2>
				<input className='leftStack entryEdit' type="text" value={this.state.entry.Title}
					onChange={e => this.onEntryTitleChange(e)} />
			</div>
			<div className='toolbar'>
				<button className='leftStack' onClick={e => this.onEditSaveClick(false)}>Save</button>
				<RawTypeDropdown name={this.props.entry.RawTypeName}
					rawTypeSelected={(name) => this.onRawTypeChange(name)} />
				<button className='leftStack' onClick={e => this.onEditSaveClick(true)}>OK</button>
				<button className='leftStack' onClick={e => this.onEditCancelClick()}>Cancel</button>
			</div>
			<p>
			</p>
			{rawPayload}
			<p>
				<label>Tags:</label><br />
				<input value={this.state.entry.Tags} onChange={e => this.onEntryTagsChange(e)} className='entryEdit' />
			</p>
		</div>
	} // end of render function
} // end of class


// We cannot simply display an image as we are not certain of its MIME Type.
// The code below is for reference purpose.
//
// if (this.state.rawTypeName == WSRawType.BinaryImage && this.state.entry.Raw != null) {
// 	// display existing image
// 	let imgUrl = "data:image/png;base64," + btoa(this.state.entry.Raw)
// 	rawPayload = <p>Image:
// 		<img src={imgUrl} />
// 	</p>
// }
