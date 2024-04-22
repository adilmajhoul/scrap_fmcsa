export const nextTableHtml = `
<center>
    <table>
        <tbody>
            <tr>
                <td>
                    <form action="pkg_carrquery.prc_carrlist" method="post">
                        <input type="hidden" name="p_begin" value="1" />
                        <input type="hidden" name="p_end" value="10" />
                        <input type="hidden" name="s_prefix" value="MC" />
                        <input type="hidden" name="n_docketno" value="" />
                        <input type="hidden" name="n_dotno" value="" />
                        <input type="hidden" name="s_legalname" value="" />
                        <input type="hidden" name="s_dbaname" value="" />
                        <input type="hidden" name="s_state" value="NJUS" />
                        <input type="hidden" name="pv_vpath" value="LIVIEW" />
                        <input type="submit" value="Previous 10 Records" />
                    </form>
                </td>
                <td>
                    <form action="pkg_carrquery.prc_carrlist" method="post">
                        <input type="hidden" name="p_begin" value="21" />
                        <input type="hidden" name="p_end" value="30" />
                        <input type="hidden" name="s_prefix" value="MC" />
                        <input type="hidden" name="n_docketno" value="" />
                        <input type="hidden" name="n_dotno" value="" />
                        <input type="hidden" name="s_legalname" value="" />
                        <input type="hidden" name="s_dbaname" value="" />
                        <input type="hidden" name="s_state" value="NJUS" />
                        <input type="hidden" name="pv_vpath" value="LIVIEW" />
                        <input type="submit" value="Next 10 Records" />
                    </form>
                </td>
            </tr>
        </tbody>
    </table>
</center>

`;
