import { Select, SelectProps } from 'antd';

interface Props {
    options: {
        label: string,
        value: string
    }[];
    value: string;
}

export function Dropdown(props: Props & SelectProps) {
    return (
        <div>
            <Select
                options={props.options}
                onChange={props.onChange}
                placeholder={props.placeholder}
                style={{ height: 40, width: 300 }}
                onBlur={props.onBlur}
                value={props.value}
            />
        </div>
    )
}
