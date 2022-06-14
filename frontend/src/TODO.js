import './allStyle.css'
import { useEffect, useState } from 'react'
const client = new WebSocket('ws://localhost:8080');

export default () => {
    const [todos,setTodos] = useState([]);
    const [nowStatus,setNowStatus] = useState('Toggle All');

    useEffect(() => {
        sendData(["init"]);
        document.getElementsByClassName('toggle_button')[0].classList += ' clicked';
    },[])

    const statusList = ['Toggle All','Toggle Active','Toggle Completed'];

    const todoObj = (id,text,isDone,isEditing) => {
        return {
            id: id,
            text: text,
            isDone: isDone,
            isEditing: isEditing
        }
    } 

    const sendData = async(data) => {
        await client.send(JSON.stringify(data));
    };
    
    client.onmessage = (byteString) => {
        const { data } = byteString;
        const [task, payload] = JSON.parse(data);
        switch (task) {
            case "init": {
                setTodos(payload);
                break;
            }
            case "add": {
                setTodos([...todos,todoObj(payload[0],payload[1],payload[2],false)]);
                break;
            }
            case "remove": {
                setTodos(todos.filter((e,i) => {
                    return i !== payload;
                    }).map((e,i) => { 
                        sendData(["updateID",[e.id,i]]);
                        return {id: i, text: e.text, isDone: e.isDone, isEditing: e.isEditing}; 
                    })
                )
                break;
            }
            case "edit": {
                sendData(["updateText",payload]);
                setTodos([...todos.slice(0,payload[0]),payload[1],...todos.slice(payload[0]+1)]);
                break;
            }
            case "delete": {
                setTodos([]);
                break;
            }
            default:
                break;
        }
    };

    const handleToggle = (t) => {
        let allToggle = document.getElementsByClassName('toggle_button');
        setNowStatus(statusList[t]);
        for(let i = 0; i < allToggle.length; i++){
            i === t ? allToggle[i].classList.add('clicked') : allToggle[i].classList.remove('clicked');
        }
    }

    const CheckBox = ({e,i}) => {
        return(
            <input checked={e.isDone} type="checkbox" style={{width: "20px", height: "20px"}} 
            onChange={() => setTodos([...todos.slice(0,i),todoObj(e.id,e.text,!e.isDone,e.isEditing),...todos.slice(i+1)])}>
            </input>
        )
    }

    const AddButton = () => {
        const [toAdd,setToAdd] = useState("");
        document.addEventListener('keypress', (e) => {
            if(e.key === "Enter"){
                document.getElementsByClassName("add_button")[0].click();
            }
        })
        const handleAdd = () => {
            if(toAdd !== ""){
                sendData(["add",[toAdd,false]]);
                setToAdd("");
            }
        }
        return(
            <>
                <div style={{display: "flex", width: "50%", marginLeft: "25%", marginTop: "25px",marginBottom: "25px"}}>
                    <input placeholder='insert new TODO...' autoFocus={true} className='add_input' onChange={(e) => setToAdd(e.target.value)} value={toAdd}></input>
                    <div className='add_button' onClick={handleAdd}>Add</div>
                </div>
            </>
        )
    }

    const RemoveButton = ({nowID, nowPos}) => {
        const handleRemove = () => {
            sendData(["remove",[nowID,nowPos]]);
        }
        return(
            <>
                <div style={{cursor: "pointer", display: "flex", alignItems: "center"}} onClick={() => handleRemove()}>
                    <img style={{width: "20px", height: "20px"}} src="https://img.icons8.com/wired/64/undefined/filled-trash.png"/>
                </div>
            </>
    
        )
    }

    const Editing = ({e,i}) => {
        const [toEdit,setToEdit] = useState("");
        document.addEventListener('keypress', (e) => {
            if(e.key === "Enter"){
                document.getElementsByClassName("edit_button")[0].click();
            }
        })
        const handleEdit = () => {
            if(toEdit !== ""){
                sendData(["edit",[i,todoObj(e.id,toEdit,e.isDone,!e.isEditing)]]);
                setToEdit("");
            }
        }
        return(
            <>
                <div style={{display: "flex", width: "70%", marginRight: "10%"}}>
                    <input className='edit_input' autoFocus={true} onChange={(e) => setToEdit(e.target.value)} value={toEdit}></input>
                    <div className='edit_button' onClick={handleEdit}>Save</div>
                </div>
            </>
        )
    }

    const showDelete = () => {
        document.getElementsByClassName('sure_section')[0].style.visibility = "visible";
    }

    const hideDelete = () => {
        document.getElementsByClassName('sure_section')[0].style.visibility = "hidden";
    }
    
    return(
        <>
            <div style={{}}>
                <AddButton></AddButton>
            </div>
            <div style={{display: "flex", alignItems: "center", width: "100%", margin: "15px 0px 15px 0px"}}>
                {statusList.map((e,i) => <div style={{width: "25%"}}><div className='toggle_button' onClick={() => handleToggle(i)}>{e}</div></div>)}
                <div style={{width: "25%"}}><div className='delete_button' onClick={() => showDelete()}>Delete All</div></div> 
            </div>
            <div className='sure_section'>
                <div className='sure_text question'>Are you sure?</div>
                <div className='sure_text yes' onClick={() => sendData(["delete"])}>YES</div>
                <div className='sure_text no' onClick={() => hideDelete()}>NO</div>
            </div>
            <div>
                {todos.map((e,i) => (nowStatus === 'Toggle All' || (nowStatus === 'Toggle Active' && !e.isDone) || (nowStatus === 'Toggle Completed' && e.isDone)) ? <div id={i} className='list_body'>
                    <div style={{width: "10%", display: "flex", alignItems: "center"}}><div style={{padding: "0px 5px 0px 5px", fontSize: "0.4cm"}}>{e.id+1}</div><CheckBox e={e} i={i}></CheckBox></div>
                    {e.isEditing ? <Editing e={e} i={i}></Editing> : <div style={{width: "80%", display: "flex", alignItems: "center"}}>{e.text}</div>}
                    <div style={{width: "5%", display: "flex", alignItems: "center", cursor: "pointer"}}>
                        <img onClick={() => setTodos([...todos.slice(0,i),todoObj(e.id,e.text,e.isDone,!e.isEditing),...todos.slice(i+1)])} 
                        style={{width: "20px", height: "20px"}} 
                        src='https://img.icons8.com/ios/50/undefined/pencil--v1.png'></img>
                    </div>
                    <div style={{width: "5%", display: "flex", alignItems: "center"}}><RemoveButton nowID={e.id} nowPos={i}></RemoveButton></div>
                </div> : <></>)}
            </div>
        </>
        
    )
}