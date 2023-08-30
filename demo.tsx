import React, { useContext, useEffect, useRef, useState } from 'react';
import './index.css';
import type { InputRef } from 'antd';
import { Button, Form, Input, Table } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { TableRowSelection } from 'antd/es/table/interface';

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
  key: string;
  name: string;
  age: string;
  address: string;
}

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof Item;
  record: Item;
  handleSave: (record: Item) => void;
  isEditing: boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  isEditing,
  ...restProps
}) => {
  const [editing, setEditing] = useState(isEditing);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing && isEditing) {
      inputRef.current!.focus();
    }
  }, [editing, isEditing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable && isEditing) {
    childNode = (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        initialValue={record[dataIndex]} // Set initial value to the current cell value
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

interface DataType {
  key: React.Key;
  name: React.ReactNode;
  age: string;
  address: string;
}

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

const App: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [dataSource, setDataSource] = useState<DataType[]>([
    {
      key: '0',
      name: 'Edward King 0',
      age: '32',
      address: 'London, Park Lane no. 0',
    },
    {
      key: '1',
      name: 'Edward King 1',
      age: '32',
      address: 'London, Park Lane no. 1',
    },
  ]);

  const handleDelete = (key: React.Key) => {
    const newData = dataSource.filter((item) => item.key !== key);
    setDataSource(newData);
  };

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const defaultColumns: (ColumnTypes[number] & {
    editable?: boolean;
    dataIndex: string;
  })[] = [
    {
      title: 'name',
      dataIndex: 'name',
      width: '50%',
      editable: true,
      render: (text: string, record: DataType) => (
        <EditableCell
          title="name"
          editable={true}
          dataIndex="name"
          record={record}
          handleSave={handleSave}
          isEditing={isEditing}
        >
          {text}
        </EditableCell>
      ),
    },
    {
      title: 'age',
      dataIndex: 'age',
      editable: true,
    },
    {
      title: 'address',
      dataIndex: 'address',
      editable: true,
    },
  ];

  const handleEditAll = () => {
    const newEditableState = !isEditing;
    setIsEditing(newEditableState);
  };

  return (
    <div>
      <Button onClick={handleEditAll}>
        {isEditing ? '切换展示模式' : '切换编辑模式'}
      </Button>
      <Table
        components={{
          body: {
            row: EditableRow,
            cell: EditableCell,
          },
        }}
        rowClassName={() => 'editable-row'}
        dataSource={dataSource}
        columns={defaultColumns.map((col) => ({
          ...col,
          onCell: (record: DataType) => ({
            record,
            editable: col.editable && isEditing,
            dataIndex: col.dataIndex,
            title: col.title,
            handleSave,
            isEditing,
          }),
        }))}
      />
    </div>
  );
};

export default App;
