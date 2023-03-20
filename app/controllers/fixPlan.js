'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const guestCheck = require('../middlewares/guestCheck');
const { bulkInsert } = require('../utils/dbOperation');

router.use(guestCheck);

/**
 * 固定予定作成
 */
router.post('/create', async (req, res) => {
    const dayIds = req.body.dayIds;
    const setId = req.body.setId;
    const title = req.body.title;
    const context = req.body.context;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const processTime = req.body.processTime;
    const travelTime = req.body.travelTime;
    const bufferTime = req.body.bufferTime;
    const planType = req.body.planType;
    const priority = req.body.priority;
    const place = req.body.place;

    const client = await pool.connect();

    try {
        // TODO: バリデーションチェックを行う
        client.query('BEGIN');

        const tableName = 'fix_plans';
        let result;

        if (setId) {
            const tableColumns = [
                'day_id',
                'set_id',
                'title',
                'context',
                'start_time',
                'end_time',
                'process_time',
                'travel_time',
                'buffer_time',
                'plan_type',
                'priority',
                'place'
            ];
            const values = dayIds.map((dayId) => [
                dayId,
                setId,
                title,
                context,
                startTime,
                endTime,
                processTime,
                travelTime,
                bufferTime,
                planType,
                priority,
                place
            ]);
            result = await bulkInsert(client, tableName, tableColumns, values);
        } else {
            const tableColumns = [
                'day_id',
                'title',
                'context',
                'start_time',
                'end_time',
                'process_time',
                'travel_time',
                'buffer_time',
                'plan_type',
                'priority',
                'place'
            ];
            const values = dayIds.map((dayId) => [
                dayId,
                title,
                context,
                startTime,
                endTime,
                processTime,
                travelTime,
                bufferTime,
                planType,
                priority,
                place
            ]);
            const insertResult = await bulkInsert(client, tableName, tableColumns, values);

            const ids = insertResult.rows.map((row) => row.id);

            // INSERTした固定予定の先頭のidをset_idとして利用する
            result = await client.query('UPDATE fix_plans SET set_id = $1 WHERE id = ANY($2::INTEGER[]) RETURNING *', [
                ids[0],
                ids
            ]);
        }

        client.query('COMMIT');
        return res.status(200).json({
            isError: false,
            fixPlans: result.rows
        });
    } catch (e) {
        client.query('ROLLBACK');
        console.error(e);
        return res.status(500).json({
            isError: true,
            errorId: 'errorId',
            errorMessage: 'システムエラー'
        });
    } finally {
        client.release();
    }
});

/**
 * 固定予定更新
 */
router.post('/update', async (req, res) => {
    const setId = req.body.setId;
    const title = req.body.title;
    const context = req.body.context;
    const startTime = req.body.startTime;
    const endTime = req.body.endTime;
    const processTime = req.body.processTime;
    const travelTime = req.body.travelTime;
    const bufferTime = req.body.bufferTime;
    const priority = req.body.priority;
    const place = req.body.place;

    const client = await pool.connect();
    try {
        // TODO: バリデーションチェックを行う
        client.query('BEGIN');

        const result = await client.query(
            'UPDATE fix_plans SET title = $1, context = $2, start_time = $3, end_time = $4, process_time = $5, travel_time = $6, buffer_time = $7, priority = $8, place = $9 \
            WHERE set_id = $10 RETURNING *',
            [title, context, startTime, endTime, processTime, travelTime, bufferTime, priority, place, setId]
        );

        client.query('COMMIT');
        return res.status(200).json({
            isError: false,
            fixPlans: result.rows
        });
    } catch (e) {
        client.query('ROLLBACK');
        console.error(e);
        return res.status(500).json({
            isError: true,
            errorId: 'errorId',
            errorMessage: 'システムエラー'
        });
    } finally {
        client.release();
    }
});

/**
 * 固定予定削除
 */
router.delete('/delete', async (req, res) => {
    const ids = req.body.ids;

    const client = await pool.connect();
    try {
        // TODO: バリデーションチェックを行う
        client.query('BEGIN');
        const result = await client.query('SELECT * FROM fix_plans WHERE id = ANY($1::INTEGER[])', [ids]);
        if (result.rows.length !== ids.length) {
            throw new Error('There is some ids that is not existing in fix_plans. ids(' + ids.join(', ') + ')');
        } else if (result.rows.some((row) => result.rows[0].set_id !== row.set_id)) {
            throw new Error(
                'There is some records that has another set_id. ids(' +
                    ids.join(', ') +
                    '), set_ids(' +
                    result.rows.map((row) => row.set_id).join(', ') +
                    ')'
            );
        }

        await client.query('DELETE FROM fix_plans WHERE id = ANY($1::INTEGER[])', [ids]);
        client.query('COMMIT');
        return res.status(200).json({
            isError: false
        });
    } catch (e) {
        client.query('ROLLBACK');
        console.error(e);
        return res.status(500).json({
            isError: true,
            errorId: 'errorId',
            errorMessage: 'システムエラー'
        });
    } finally {
        client.release();
    }
});

module.exports = router;