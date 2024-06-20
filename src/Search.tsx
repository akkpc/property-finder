import { LoadingOutlined } from '@ant-design/icons';
import { Button, Select, Spin, Typography } from "antd";
import { useEffect, useState } from "react";

const supplierDataform = "Supplier_Master_A20";
const selectedSupplierName = "PR_Selected_Supplier";
const selectedCategoryName = "PR_Selected_Category";

const KFSDK = require("@kissflow/lowcode-client-sdk");

interface Category {
    _id: string;
    name: "Goods" | "Services";
}


interface Supplier {
    _id: string;
    Supplier: string;
}
const Category: Category[] = [{
    _id: "Goods",
    name: "Goods"
}, {
    _id: "Services",
    name: "Services"
}]
const dropdownWidth = 240;
const listHeight = 80;
export default function Search() {
    const [suppliers, setSuppliers] = useState<Supplier[]>();
    const [selectedSupplier, setSelectedSupplier] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [disable, setDisable] = useState(false);
    const [cartButtonDisable, setCardButtonDisable] = useState(false);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        (async () => {
            setLoading(true);
            await KFSDK.initialize();
            const suppliers = await getSuppliers();
            const existingPR = await findExistingPR();

            if (existingPR) {
                const defaultSelectedSupplier = await KFSDK.app.getVariable(selectedSupplierName);
                const defaultSelectedCategory = await KFSDK.app.getVariable(selectedCategoryName);
                if (defaultSelectedSupplier && defaultSelectedCategory) {
                    setSelectedCategory(defaultSelectedCategory);
                    setSelectedSupplier(defaultSelectedSupplier);
                    setDisable(true);
                    setCardButtonDisable(false);
                }
            } else {
                await KFSDK.app.setVariable(selectedSupplierName, null);
                await KFSDK.app.setVariable(selectedCategoryName, null);
                setCardButtonDisable(true);
            }
            setSuppliers(suppliers);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (selectedSupplier) {
            (async () => {
                await KFSDK.app.setVariable(selectedSupplierName, selectedSupplier);
                await refreshComponent();
            })()
        }
    }, [selectedSupplier])

    useEffect(() => {
        if (selectedCategory) {
            (async () => {
                await KFSDK.app.setVariable(selectedCategoryName, selectedCategory);
                await refreshComponent();
            })()
        }
    }, [selectedCategory])

    async function getSuppliers() {
        const response = await KFSDK.api(`/form/2/${KFSDK.account._id}/${supplierDataform}/allitems/list?&page_number=1&page_size=10000`, {
            method: "POST",
            body: JSON.stringify({
                Sort: [
                    {
                        "Name": "Supplier",
                        "Field": "Supplier",
                        "SortType": "ASC",
                        "IsDefault": true,
                        "Id": "Supplier",
                        "chosen": false,
                        "selected": false
                    }
                ]
            })
        })
        const categories: Supplier[] = response.Data;
        return categories;
    }

    async function refreshComponent() {
        const component = await KFSDK.app.page.getComponent("FormViewGallery_V5MS7RVLpt");
        component.refresh().catch((err: any) => {
            console.log("Error:  ", err)
        });
    }

    async function discardCurentPR() {
        const existingPR = await findExistingPR();
        if (existingPR) {
            await KFSDK.client.showConfirm({ title: "Discard Cart", content: "Are you sure want to clear the cart ?" }).then((action: any) => {
                if (action === "OK") {
                    KFSDK.app.setVariable("Cart_Item_Count", 0);
                    KFSDK.api("/process/2/" + KFSDK.account._id + "/Requisition_A89/" + existingPR._id, { method: "DELETE" });
                }
            })
            return true;
        }
        return false;
    }

    async function findExistingPR() {
        let my_req_draft_items = await KFSDK.api("/process/2/" + KFSDK.account._id + "/Requisition_A89/myitems/draft");
        let items = my_req_draft_items.Data;
        let existingPR = items.find((d: any) => d.Buying_channel_text == "Hosted catalog");
        return existingPR;
    }

    const filterOption = (input: string, option?: { label: string; value: string }) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }} >
            {
                loading ?
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }} >
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    </div>
                    :
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, width: "100%", justifyContent: "center" }} >
                        <div style={{ marginLeft: 10 }} >
                            <Typography style={{ textAlign: "left", fontWeight: 600 }} >Category Type</Typography>
                            <Select
                                options={Category ? Category?.map((cat) => ({ value: cat._id, label: cat.name })) : []}
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e);
                                }}
                                style={{ width: dropdownWidth }}
                                showSearch
                                filterOption={filterOption}
                                listHeight={listHeight}
                                disabled={disable}
                            />
                        </div>
                        <div>
                            <Typography style={{ textAlign: "left", fontWeight: 600 }} >Suppliers</Typography>
                            <Select
                                options={suppliers ? suppliers?.map((cat) => ({ value: cat._id, label: cat.Supplier })) : []}
                                value={selectedSupplier}
                                onChange={(e) => {
                                    setSelectedSupplier(e);
                                }}
                                style={{ width: dropdownWidth }}
                                showSearch
                                filterOption={filterOption}
                                listHeight={listHeight}
                                disabled={disable}
                            />
                        </div>
                        <div>
                            <Button
                                type="primary"
                                style={{
                                    // backgroundColor: "#0565ff",
                                    height: "32px",
                                    width: 80
                                }}
                                onClick={async () => {
                                    const discarded = await discardCurentPR();
                                    if (discarded) {
                                        setSelectedSupplier("");
                                        setSelectedCategory("");
                                        setDisable(false);
                                        setCardButtonDisable(true);
                                        await KFSDK.app.setVariable(selectedCategoryName, "");
                                        await KFSDK.app.setVariable(selectedSupplierName, "");
                                        await refreshComponent();
                                    }
                                }}
                                disabled={cartButtonDisable}
                            >
                                Clear Cart
                            </Button>
                        </div>
                    </div>
            }
        </div>
    )
}
